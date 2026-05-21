import { supabase } from '../lib/supabaseClient';
import { convertQuantity } from '../lib/unitConversion';
import { getIngredients } from './ingredientService';

function indexById(rows) {
  return (rows || []).reduce((map, row) => {
    map[row.id] = row;
    return map;
  }, {});
}

async function attachRecipeItems(recipes) {
  if (!recipes.length) return recipes;

  const recipeIds = recipes.map((recipe) => recipe.id);
  const [{ data: items, error: itemsError }, ingredients] = await Promise.all([
    supabase
      .from('recipe_items')
      .select('id, recipe_id, ingredient_id, quantity_required, unit')
      .in('recipe_id', recipeIds)
      .order('created_at', { ascending: true }),
    getIngredients(),
  ]);

  if (itemsError) throw itemsError;

  const ingredientsById = indexById(ingredients);
  const itemsByRecipeId = {};

  (items || []).forEach((item) => {
    if (!itemsByRecipeId[item.recipe_id]) itemsByRecipeId[item.recipe_id] = [];
    itemsByRecipeId[item.recipe_id].push({
      ...item,
      ingredients: ingredientsById[item.ingredient_id] || null,
    });
  });

  return recipes.map((recipe) => ({
    ...recipe,
    recipe_items: itemsByRecipeId[recipe.id] || [],
  }));
}

export async function getRecipes() {
  if (!supabase) return [];

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, name, menu_item_id, expected_yield, yield_unit, notes, active, created_at, updated_at')
    .order('name', { ascending: true });

  if (error) throw error;

  const menuItemIds = [...new Set((recipes || []).map((recipe) => recipe.menu_item_id).filter(Boolean))];
  let menuItemsById = {};

  if (menuItemIds.length > 0) {
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .in('id', menuItemIds);

    if (menuItemsError) throw menuItemsError;
    menuItemsById = indexById(menuItems);
  }

  const recipesWithItems = await attachRecipeItems(recipes || []);
  return recipesWithItems.map((recipe) => ({
    ...recipe,
    menu_items: menuItemsById[recipe.menu_item_id] || null,
  }));
}

export async function getRecipe(recipeId) {
  const recipes = await getRecipes();
  return recipes.find((recipe) => recipe.id === recipeId) || null;
}

export async function calculateRecipeCost(recipeId, quantityProduced) {
  const recipe = await getRecipe(recipeId);
  if (!recipe) throw new Error('Recipe not found.');

  const scale = Number(quantityProduced || 0) / Number(recipe.expected_yield || 1);
  if (scale <= 0) throw new Error('Quantity produced must be greater than zero.');

  const breakdown = (recipe.recipe_items || []).map((item) => {
    const ingredient = item.ingredients;
    if (!ingredient) throw new Error('Recipe has an ingredient that no longer exists.');

    const quantityUsedInIngredientUnit = convertQuantity(
      Number(item.quantity_required || 0) * scale,
      item.unit,
      ingredient.unit,
    );
    const totalCost = quantityUsedInIngredientUnit * Number(ingredient.cost_per_unit || 0);

    return {
      recipe_item_id: item.id,
      ingredient_id: item.ingredient_id,
      ingredient_name: ingredient.name,
      ingredient_unit: ingredient.unit,
      quantity_used: Number(quantityUsedInIngredientUnit.toFixed(3)),
      cost_per_unit: Number(ingredient.cost_per_unit || 0),
      total_cost: Number(totalCost.toFixed(2)),
      available_stock: Number(ingredient.current_stock || 0),
    };
  });

  const totalCost = breakdown.reduce((sum, item) => sum + item.total_cost, 0);
  return {
    recipe,
    quantityProduced: Number(quantityProduced),
    totalCost: Number(totalCost.toFixed(2)),
    costPerUnit: Number((totalCost / Number(quantityProduced)).toFixed(2)),
    breakdown,
  };
}

export async function saveRecipe(recipe, items) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = {
    name: recipe.name?.trim(),
    menu_item_id: recipe.menu_item_id ? Number(recipe.menu_item_id) : null,
    expected_yield: Number(recipe.expected_yield || 1),
    yield_unit: recipe.yield_unit || 'pcs',
    notes: recipe.notes || null,
    active: recipe.active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (!payload.name) throw new Error('Recipe name is required.');
  if (payload.expected_yield <= 0) throw new Error('Expected yield must be greater than zero.');

  const query = recipe.id
    ? supabase.from('recipes').update(payload).eq('id', recipe.id)
    : supabase.from('recipes').insert(payload);

  const { data: savedRecipe, error } = await query.select().single();
  if (error) throw error;

  const cleanItems = (items || [])
    .filter((item) => item.ingredient_id && Number(item.quantity_required || 0) > 0)
    .map((item) => ({
      recipe_id: savedRecipe.id,
      ingredient_id: item.ingredient_id,
      quantity_required: Number(item.quantity_required),
      unit: item.unit || 'pcs',
    }));

  const { error: deleteError } = await supabase
    .from('recipe_items')
    .delete()
    .eq('recipe_id', savedRecipe.id);

  if (deleteError) throw deleteError;

  if (cleanItems.length > 0) {
    const { error: itemError } = await supabase.from('recipe_items').insert(cleanItems);
    if (itemError) throw itemError;
  }

  if (savedRecipe.menu_item_id) {
    await supabase
      .from('menu_items')
      .update({ recipe_id: savedRecipe.id })
      .eq('id', savedRecipe.menu_item_id);
  }

  return getRecipe(savedRecipe.id);
}

export default {
  getRecipes,
  getRecipe,
  calculateRecipeCost,
  saveRecipe,
};
