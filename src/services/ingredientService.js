import { supabase } from '../lib/supabaseClient';

function mapById(rows) {
  return (rows || []).reduce((map, row) => {
    map[row.id] = row;
    return map;
  }, {});
}

export async function getIngredients() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, unit, current_stock, low_stock_threshold, supplier_id, cost_per_unit, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveIngredient(ingredient) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = {
    name: ingredient.name?.trim(),
    unit: ingredient.unit || 'pcs',
    current_stock: Number(ingredient.current_stock || 0),
    low_stock_threshold: Number(ingredient.low_stock_threshold || 0),
    supplier_id: ingredient.supplier_id || null,
    cost_per_unit: Number(ingredient.cost_per_unit || 0),
    updated_at: new Date().toISOString(),
  };

  if (!payload.name) throw new Error('Ingredient name is required.');

  const query = ingredient.id
    ? supabase.from('ingredients').update(payload).eq('id', ingredient.id)
    : supabase.from('ingredients').insert(payload);

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function recordIngredientMovement({ ingredientId, movementType, quantityDelta, unitCost = null, productionBatchId = null, note = '' }) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { error } = await supabase.from('ingredient_movements').insert({
    ingredient_id: ingredientId,
    movement_type: movementType,
    quantity_delta: Number(quantityDelta),
    unit_cost: unitCost === null ? null : Number(unitCost),
    production_batch_id: productionBatchId,
    note: note || null,
  });

  if (error) throw error;
}

export async function restockIngredient(ingredientId, quantity, unitCost, note = 'Manual ingredient restock') {
  if (!supabase) throw new Error('Supabase is not configured.');

  const ingredients = await getIngredients();
  const ingredient = mapById(ingredients)[ingredientId];
  if (!ingredient) throw new Error('Ingredient not found.');

  const nextStock = Number(ingredient.current_stock || 0) + Number(quantity || 0);
  const nextCost = unitCost === '' || unitCost === null || unitCost === undefined
    ? Number(ingredient.cost_per_unit || 0)
    : Number(unitCost);

  const { error } = await supabase
    .from('ingredients')
    .update({
      current_stock: nextStock,
      cost_per_unit: nextCost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ingredientId);

  if (error) throw error;

  await recordIngredientMovement({
    ingredientId,
    movementType: 'restock',
    quantityDelta: Number(quantity || 0),
    unitCost: nextCost,
    note,
  });
}

export async function getIngredientCostTrends(startDate, endDate) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ingredient_movements')
    .select('ingredient_id, quantity_delta, unit_cost, movement_type, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  const ingredients = mapById(await getIngredients());
  return (data || []).map((movement) => ({
    ...movement,
    ingredient_name: ingredients[movement.ingredient_id]?.name || 'Ingredient',
  }));
}

export default {
  getIngredients,
  saveIngredient,
  restockIngredient,
  recordIngredientMovement,
  getIngredientCostTrends,
};
