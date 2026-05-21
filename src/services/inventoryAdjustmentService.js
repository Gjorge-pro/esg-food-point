import { supabase } from '../lib/supabaseClient';

/**
 * Restore inventory stock when an order is cancelled or marked as waste.
 * It increments the stock_quantity for each menu item in the order and logs a movement.
 *
 * @param {Array} orderItems - Array of order_items with menu_item_id and quantity
 * @returns {Promise<{ok:boolean, error?:string}>}
 */
export async function restoreStockAfterCancellation(orderItems) {
  if (!supabase) return { ok: true };
  if (!orderItems?.length) return { ok: true };

  const updates = [];
  const movements = [];
  for (const item of orderItems) {
    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) continue;
    // Increment stock
    updates.push(
      supabase
        .from('inventory')
        .update({
          stock_quantity: supabase.raw(`stock_quantity + ${quantity}`),
          updated_at: new Date().toISOString(),
        })
        .eq('menu_item_id', item.menu_item_id)
    );
    movements.push({
      inventory_id: null, // will be resolved via trigger or later join
      menu_item_id: item.menu_item_id,
      movement_type: 'restock',
      quantity_delta: quantity,
      note: 'Restocked due to order cancellation/waste',
    });
  }
  // Execute updates
  const updateResponses = await Promise.all(updates);
  const updError = updateResponses.find(r => r.error)?.error;
  if (updError) return { ok: false, error: updError };
  // Insert movements if any
  if (movements.length) {
    const { error } = await supabase.from('inventory_movements').insert(movements);
    if (error) return { ok: false, error };
  }
  return { ok: true };
}

export default { restoreStockAfterCancellation };
