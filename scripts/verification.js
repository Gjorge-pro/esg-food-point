import { supabase } from '../src/lib/supabaseClient';
import { updateOrderStatus } from '../src/lib/orderWorkflowService';
import { allocateProduction, revertProduction } from '../src/services/productionService';
import { restoreStockAfterCancellation } from '../src/services/inventoryAdjustmentService';
import { updateStockAfterOrder } from '../src/lib/inventoryService';

async function resetTables() {
  // Delete test data (ignore errors)
  await supabase.from('order_items').delete();
  await supabase.from('orders').delete();
  await supabase.from('production_usage').delete();
  await supabase.from('production_batches').delete();
  await supabase.from('inventory').delete();
  await supabase.from('inventory_movements').delete();
}

async function seedData() {
  // Create a menu item (id 1) with price 10
  const { data: menuItem, error: menuErr } = await supabase
    .from('menu_items')
    .insert({ name: 'Test Dish', price: 10 })
    .single();
  if (menuErr) throw menuErr;

  // Inventory record for the dish
  const { error: invErr } = await supabase.from('inventory').insert({
    menu_item_id: menuItem.id,
    stock_quantity: 100,
    unit: 'pcs',
    low_stock_threshold: 10,
    updated_at: new Date().toISOString(),
  });
  if (invErr) throw invErr;

  // Two production batches for the same dish
  const batchA = await supabase.from('production_batches').insert({
    menu_item_id: menuItem.id,
    quantity_produced: 40,
    remaining_quantity: 40,
    cost_per_unit: 2,
    created_at: new Date().toISOString(),
  }).single();
  const batchB = await supabase.from('production_batches').insert({
    menu_item_id: menuItem.id,
    quantity_produced: 30,
    remaining_quantity: 30,
    cost_per_unit: 2.5,
    created_at: new Date(Date.now() + 1000).toISOString(),
  }).single();

  return { menuItem, batches: [batchA.data, batchB.data] };
}

async function createOrder(menuItemId, quantity) {
  const { data: order, error } = await supabase.from('orders').insert({
    status: 'pending',
    order_type: 'dine_in',
    created_at: new Date().toISOString(),
  }).single();
  if (error) throw error;

  const { error: itemsErr } = await supabase.from('order_items').insert({
    order_id: order.id,
    menu_item_id: menuItemId,
    quantity,
  });
  if (itemsErr) throw itemsErr;
  return order;
}

async function verifyInventory(expected) {
  const { data, error } = await supabase
    .from('inventory')
    .select('stock_quantity')
    .eq('menu_item_id', expected.menu_item_id)
    .single();
  if (error) throw error;
  console.log('Inventory stock_quantity =', data.stock_quantity, '(expected', expected.stock_quantity, ')');
}

async function verifyProductionBatches(expected) {
  const { data, error } = await supabase
    .from('production_batches')
    .select('id, remaining_quantity')
    .in('id', expected.map(b => b.id));
  if (error) throw error;
  console.log('Production batches remaining quantities:', data);
}

async function run() {
  console.log('--- Resetting tables ---');
  await resetTables();

  console.log('--- Seeding data ---');
  const { menuItem, batches } = await seedData();

  console.log('--- Creating order of 50 units (exceeds first batch) ---');
  const order = await createOrder(menuItem.id, 50);

  console.log('--- Accepting order (should deduct inventory and allocate batches) ---');
  await updateOrderStatus(order.id, 'accepted');

  console.log('--- Verifying inventory (should be 50 left) ---');
  await verifyInventory({ menu_item_id: menuItem.id, stock_quantity: 50 });

  console.log('--- Verifying production batches (first batch 0, second batch 20) ---');
  await verifyProductionBatches([
    { id: batches[0].id, remaining_quantity: 0 },
    { id: batches[1].id, remaining_quantity: 20 },
  ]);

  console.log('--- Cancelling order (should restore inventory and production) ---');
  await updateOrderStatus(order.id, 'cancelled');

  console.log('--- Verifying inventory restored (should be back to 100) ---');
  await verifyInventory({ menu_item_id: menuItem.id, stock_quantity: 100 });

  console.log('--- Verifying production batches restored (40 and 30) ---');
  await verifyProductionBatches([
    { id: batches[0].id, remaining_quantity: 40 },
    { id: batches[1].id, remaining_quantity: 30 },
  ]);

  console.log('--- Edge case: insufficient production (order 100 units) ---');
  const largeOrder = await createOrder(menuItem.id, 100);
  await updateOrderStatus(largeOrder.id, 'accepted');
  const { data: invAfter } = await supabase.from('inventory').select('stock_quantity').eq('menu_item_id', menuItem.id).single();
  console.log('Inventory after over‑production consume =', invAfter.stock_quantity);
  const { data: batchesAfter } = await supabase.from('production_batches').select('remaining_quantity').in('id', [batches[0].id, batches[1].id]);
  console.log('Production batches after over‑consume =', batchesAfter);

  console.log('--- Test complete ---');
}

run().catch(err => console.error('Verification error:', err));
