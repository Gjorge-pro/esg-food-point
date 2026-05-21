import { supabase } from '../lib/supabaseClient';
import { calculateRecipeCost } from './recipeService';

/**
 * Create a production batch for a menu item.
 * Initializes remaining_quantity equal to quantity_produced.
 */
export async function createProductionBatch(menuItemId, quantityProduced, costPerUnit = 0, recipeId = null) {
  if (!supabase) throw new Error('Supabase not configured');
  if (!menuItemId || quantityProduced <= 0) throw new Error('Invalid menu item or quantity');

  const { data, error } = await supabase
    .from('production_batches')
    .insert({
      menu_item_id: menuItemId,
      quantity_produced: quantityProduced,
      remaining_quantity: quantityProduced, // Initialize with full quantity
      cost_per_unit: costPerUnit || 0,
      recipe_id: recipeId,
      production_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a production batch from a recipe.
 * This calculates ingredient usage, deducts ingredient stock, stores exact
 * batch cost, and preserves Phase B FIFO allocation through production_batches.
 */
export async function createRecipeProductionBatch(recipeId, quantityProduced) {
  if (!supabase) throw new Error('Supabase not configured');

  const costing = await calculateRecipeCost(recipeId, quantityProduced);
  const menuItemId = costing.recipe.menu_item_id;
  if (!menuItemId) throw new Error('This recipe is not connected to a menu item.');

  const insufficient = costing.breakdown.filter(
    (item) => Number(item.available_stock || 0) < Number(item.quantity_used || 0),
  );
  if (insufficient.length > 0) {
    throw new Error(
      `Insufficient ingredient stock: ${insufficient
        .map((item) => `${item.ingredient_name} needs ${item.quantity_used} ${item.ingredient_unit}`)
        .join(', ')}`,
    );
  }

  const batch = await createProductionBatch(menuItemId, quantityProduced, costing.costPerUnit, recipeId);

  const usageRows = costing.breakdown.map((item) => ({
    production_batch_id: batch.id,
    recipe_id: recipeId,
    ingredient_id: item.ingredient_id,
    quantity_used: item.quantity_used,
    unit: item.ingredient_unit,
    cost_per_unit: item.cost_per_unit,
  }));

  if (usageRows.length > 0) {
    const { error } = await supabase.from('production_ingredient_usage').insert(usageRows);
    if (error) throw error;
  }

  for (const item of costing.breakdown) {
    const nextStock = Math.max(0, Number(item.available_stock || 0) - Number(item.quantity_used || 0));

    const { error: updateError } = await supabase
      .from('ingredients')
      .update({ current_stock: nextStock, updated_at: new Date().toISOString() })
      .eq('id', item.ingredient_id);

    if (updateError) throw updateError;

    const { error: movementError } = await supabase.from('ingredient_movements').insert({
      ingredient_id: item.ingredient_id,
      movement_type: 'production',
      quantity_delta: -Number(item.quantity_used || 0),
      unit_cost: item.cost_per_unit,
      production_batch_id: batch.id,
      note: `Production batch for ${costing.recipe.name}`,
    });

    if (movementError) throw movementError;
  }

  return {
    ...batch,
    recipe: costing.recipe,
    ingredient_breakdown: costing.breakdown,
    calculated_total_cost: costing.totalCost,
    calculated_cost_per_unit: costing.costPerUnit,
  };
}

/**
 * Allocate production batches for an order.
 * For each order item, it finds the oldest production batch with remaining quantity
 * and deducts the required amount. Returns an array of allocations for possible reversal.
 */
export async function allocateProduction(orderId, orderItems) {
  const allocations = [];
  const usageRecords = [];
  
  for (const item of orderItems) {
    const needed = Number(item.quantity || 0);
    if (needed <= 0) continue;
    let remaining = needed;
    
    // Fetch batches for the menu item ordered, ordered by oldest first (FIFO)
    const { data: batches, error: fetchErr } = await supabase
      .from('production_batches')
      .select('id, menu_item_id, quantity_produced, remaining_quantity')
      .eq('menu_item_id', item.menu_item_id)
      .gt('remaining_quantity', 0)
      .order('created_at', { ascending: true });
    
    if (fetchErr) throw fetchErr;
    
    for (const batch of batches) {
      if (remaining <= 0) break;
      
      const available = Number(batch.remaining_quantity);
      const deduct = Math.min(available, remaining);
      const newRemaining = available - deduct;
      
      // Update batch remaining quantity
      const { error: updErr } = await supabase
        .from('production_batches')
        .update({ remaining_quantity: newRemaining })
        .eq('id', batch.id);
      
      if (updErr) throw updErr;
      
      // Record for reversal tracking
      allocations.push({ 
        batch_id: batch.id, 
        menu_item_id: item.menu_item_id, 
        quantity: deduct, 
        order_id: orderId 
      });
      
      // Track usage for audit trail
      usageRecords.push({
        order_id: orderId,
        batch_id: batch.id,
        menu_item_id: item.menu_item_id,
        quantity: deduct
      });
      
      remaining -= deduct;
    }
    
    if (remaining > 0) {
      console.warn('Insufficient production batches for item', item.menu_item_id, 'needed', remaining, 'units');
    }
  }
  
  // Persist usage records for audit trail
  if (usageRecords.length) {
    const { error: insErr } = await supabase.from('production_usage').insert(usageRecords);
    if (insErr) {
      console.error('Failed to log production usage', insErr);
      // Don't throw - continue even if audit logging fails
    }
  }
  
  return allocations;
}

/**
 * Revert production allocations when an order is cancelled/refunded.
 * Restores remaining quantities in production batches and removes usage records.
 */
export async function revertProduction(allocations) {
  if (!allocations || !allocations.length) {
    console.warn('No allocations to revert');
    return { ok: true };
  }

  try {
    // Restore batch quantities
    for (const alloc of allocations) {
      const { error } = await supabase
        .from('production_batches')
        .update({ 
          remaining_quantity: supabase.raw(`remaining_quantity + ${alloc.quantity}`) 
        })
        .eq('id', alloc.batch_id);
      
      if (error) {
        console.error('Failed to revert production batch', alloc.batch_id, error);
        // Continue reverting other batches even if one fails
      }
    }

    // Delete production usage records for this order
    // Get the order_id from first allocation
    const orderId = allocations[0]?.order_id;
    if (orderId) {
      const { error: delErr } = await supabase
        .from('production_usage')
        .delete()
        .eq('order_id', orderId);
      
      if (delErr) {
        console.error('Failed to delete production usage records', delErr);
      }
    }

    return { ok: true };
  } catch (error) {
    console.error('Error reverting production allocations:', error);
    return { ok: false, error };
  }
}

/**
 * Get production batch consumption report for a date range.
 * Shows how much of each batch has been consumed.
 */
export async function getBatchConsumptionReport(startDate, endDate) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('production_usage')
    .select(`
      id,
      batch_id,
      menu_item_id,
      quantity,
      order_id,
      created_at,
      production_batches:batch_id(quantity_produced, remaining_quantity, production_date),
      menu_items:menu_item_id(name)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting batch consumption report:', error);
    return [];
  }

  return data || [];
}

export default {
  createProductionBatch,
  createRecipeProductionBatch,
  allocateProduction,
  revertProduction,
  getBatchConsumptionReport
};
