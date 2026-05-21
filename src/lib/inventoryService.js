import { supabase } from './supabaseClient';

function isMissingTableError(error) {
  return (
    error?.code === 'PGRST205' ||
    error?.status === 404 ||
    error?.message?.includes('Could not find the table')
  );
}

function shouldSkipInventoryRequests() {
  const retryAt = Number(window.localStorage.getItem('esg-inventory-retry-at') || 0);
  return retryAt > Date.now();
}

function markInventoryTableMissing() {
  window.localStorage.setItem('esg-inventory-retry-at', String(Date.now() + 5 * 60 * 1000));
}

function markInventoryTableAvailable() {
  window.localStorage.removeItem('esg-inventory-retry-at');
}

export function isLowStock(inventoryItem) {
  return Number(inventoryItem?.stock_quantity || 0) <= Number(inventoryItem?.low_stock_threshold || 0);
}

/**
 * Validate that sufficient stock exists for order items.
 * Returns { ok: true } if valid, or { ok: false, errors: [...] } if validation fails.
 */
export async function validateStockAvailability(orderItems) {
  if (!supabase || !orderItems?.length) return { ok: true };

  const inventoryByMenuId = await getInventoryByMenuIds(orderItems.map((item) => item.menu_item_id));
  const errors = [];

  for (const item of orderItems) {
    const inventory = inventoryByMenuId[item.menu_item_id];
    const requested = Number(item.quantity || 0);
    const available = Number(inventory?.stock_quantity || 0);
    const prevent_empty = inventory?.prevent_order_when_empty;

    // Check if stock prevents order when empty
    if (prevent_empty && available <= 0) {
      errors.push({
        menu_item_id: item.menu_item_id,
        reason: 'OUT_OF_STOCK',
        message: `Item is out of stock and orders are blocked when empty`
      });
    }

    // Check if sufficient stock available
    if (available < requested) {
      errors.push({
        menu_item_id: item.menu_item_id,
        reason: 'INSUFFICIENT_STOCK',
        available: available,
        requested: requested,
        message: `Insufficient stock. Available: ${available}, Requested: ${requested}`
      });
    }
  }

  return errors.length === 0 
    ? { ok: true } 
    : { ok: false, errors };
}

/**
 * Check stock levels and return low stock warnings.
 */
export async function checkStockLevels(orderItems) {
  if (!supabase || !orderItems?.length) return { low_stock_items: [] };

  const inventoryByMenuId = await getInventoryByMenuIds(orderItems.map((item) => item.menu_item_id));
  const lowStockItems = [];

  for (const item of orderItems) {
    const inventory = inventoryByMenuId[item.menu_item_id];
    if (inventory && isLowStock(inventory)) {
      lowStockItems.push({
        menu_item_id: item.menu_item_id,
        current_stock: inventory.stock_quantity,
        threshold: inventory.low_stock_threshold
      });
    }
  }

  return { low_stock_items: lowStockItems };
}

export async function getInventory() {
  if (!supabase) return [];
  if (shouldSkipInventoryRequests()) return [];

  const { data, error } = await supabase
    .from('inventory')
    .select('id, menu_item_id, stock_quantity, unit, low_stock_threshold, prevent_order_when_empty, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      markInventoryTableMissing();
      return [];
    }
    throw error;
  }

  markInventoryTableAvailable();
  const inventoryItems = data || [];
  const menuItemIds = [...new Set(inventoryItems.map((item) => item.menu_item_id).filter(Boolean))];

  if (menuItemIds.length === 0) {
    return inventoryItems;
  }

  const { data: menuItems, error: menuItemsError } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .in('id', menuItemIds);

  if (menuItemsError) throw menuItemsError;

  const menuItemsById = (menuItems || []).reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});

  return inventoryItems.map((item) => ({
    ...item,
    menu_items: menuItemsById[item.menu_item_id] || null,
  }));
}

export async function getInventoryByMenuIds(menuItemIds) {
  if (!supabase || menuItemIds.length === 0) return {};
  if (shouldSkipInventoryRequests()) return {};

  const { data, error } = await supabase
    .from('inventory')
    .select('id, menu_item_id, stock_quantity, unit, low_stock_threshold, prevent_order_when_empty')
    .in('menu_item_id', menuItemIds);

  if (error) {
    if (isMissingTableError(error)) {
      markInventoryTableMissing();
      return {};
    }
    throw error;
  }

  markInventoryTableAvailable();
  return (data || []).reduce((map, item) => {
    map[item.menu_item_id] = item;
    return map;
  }, {});
}

export async function saveInventoryItem(item) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = {
    menu_item_id: Number(item.menu_item_id),
    stock_quantity: Number(item.stock_quantity),
    unit: item.unit || 'pcs',
    low_stock_threshold: Number(item.low_stock_threshold || 0),
    prevent_order_when_empty: Boolean(item.prevent_order_when_empty),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('inventory')
    .upsert(payload, { onConflict: 'menu_item_id' });

  if (error) throw error;
}

export async function updateStockAfterOrder(orderId, orderItems) {
  if (!supabase || !orderId || !orderItems?.length) return { ok: true, skipped: true };

  // Validate stock availability before updating
  const validation = await validateStockAvailability(orderItems);
  if (!validation.ok) {
    console.warn('Stock validation failed for order', orderId, validation.errors);
    // Note: We continue with the update to track the attempt, but log the validation failure
  }

  const inventoryByMenuId = await getInventoryByMenuIds(orderItems.map((item) => item.menu_item_id));
  const updates = [];
  const movements = [];

  for (const item of orderItems) {
    const inventory = inventoryByMenuId[item.menu_item_id];
    if (!inventory) continue;

    const quantity = Number(item.quantity || 0);
    const currentStock = Number(inventory.stock_quantity || 0);
    
    // Prevent going below 0 by capping at 0 (but log if this happens)
    const nextStock = Math.max(0, currentStock - quantity);
    if (nextStock < 0) {
      console.warn(
        `Stock would go negative for menu_item ${item.menu_item_id}. Current: ${currentStock}, Requested: ${quantity}. Setting to 0.`
      );
    }

    updates.push(
      supabase
        .from('inventory')
        .update({ stock_quantity: nextStock, updated_at: new Date().toISOString() })
        .eq('id', inventory.id),
    );

    movements.push({
      inventory_id: inventory.id,
      menu_item_id: item.menu_item_id,
      order_id: orderId,
      movement_type: 'sale',
      quantity_delta: -quantity,
      note: 'Automatic stock reduction after order placement',
    });
  }

  const updateResponses = await Promise.all(updates);
  const updateError = updateResponses.find((response) => response.error)?.error;
  if (updateError) throw updateError;

  if (movements.length > 0) {
    const { error } = await supabase.from('inventory_movements').insert(movements);
    if (error && !isMissingTableError(error)) throw error;
  }

  return { ok: true };
}

export async function getLowStockItems() {
  const inventory = await getInventory();
  return inventory.filter(isLowStock);
}

export default {
  getInventory,
  getInventoryByMenuIds,
  saveInventoryItem,
  validateStockAvailability,
  checkStockLevels,
  updateStockAfterOrder,
  getLowStockItems,
  isLowStock,
};
