import { supabase } from '../lib/supabaseClient';
import { formatDateOnly } from '../lib/financialService';

const TODAY = () => formatDateOnly(new Date());

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
}

function isMissingColumnError(error) {
  return error?.code === 'PGRST204' || error?.message?.includes('Could not find the');
}

export async function getOrCreateDailySession(businessDate = TODAY(), userId = null) {
  ensureSupabase();

  const { data: existing, error: findError } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('business_date', businessDate)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('daily_sessions')
    .insert({
      business_date: businessDate,
      status: 'opening',
      opened_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSessionStatus(sessionId, updates) {
  ensureSupabase();

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('daily_sessions')
    .update(payload)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function openSession(sessionId, { userId, notes, cashOpening }) {
  return updateSessionStatus(sessionId, {
    status: 'open',
    opened_by: userId,
    opening_notes: notes || null,
    cash_opening: Number(cashOpening || 0),
    opened_at: new Date().toISOString(),
  });
}

export async function startClosing(sessionId) {
  return updateSessionStatus(sessionId, { status: 'closing' });
}

export async function closeSession(sessionId, { userId, notes, cashClosing }) {
  return updateSessionStatus(sessionId, {
    status: 'closed',
    closed_by: userId,
    closing_notes: notes || null,
    cash_closing: cashClosing === '' || cashClosing === null ? null : Number(cashClosing || 0),
    closed_at: new Date().toISOString(),
  });
}

export async function recordOpeningStock(sessionId, item) {
  ensureSupabase();
  const payload = {
    session_id: sessionId,
    item_name: item.item_name,
    quantity: Number(item.quantity || 0),
    recorded_date: item.recorded_date || TODAY(),
  };

  return insertWithSessionFallback('stock_opening', payload);
}

export async function recordClosingStock(sessionId, item) {
  ensureSupabase();
  const payload = {
    session_id: sessionId,
    item_name: item.item_name,
    quantity: Number(item.quantity || 0),
    recorded_date: item.recorded_date || TODAY(),
  };

  return insertWithSessionFallback('stock_closing', payload);
}

export async function recordWaste(sessionId, item) {
  ensureSupabase();
  const quantity = Number(item.quantity || 0);
  const inventory = await getInventoryForMenuItem(item.menu_item_id);
  const payload = {
    session_id: sessionId,
    inventory_id: inventory?.id || null,
    menu_item_id: Number(item.menu_item_id),
    movement_type: 'waste',
    quantity_delta: -Math.abs(quantity),
    note: item.note || 'Daily operations waste record',
  };

  const movement = await insertWithSessionFallback('inventory_movements', payload);
  await adjustInventoryQuantity(inventory, -Math.abs(quantity));
  return movement;
}

export async function recordLeftover(sessionId, item) {
  ensureSupabase();
  const quantity = Number(item.quantity || 0);
  const inventory = await getInventoryForMenuItem(item.menu_item_id);
  const payload = {
    session_id: sessionId,
    inventory_id: inventory?.id || null,
    menu_item_id: Number(item.menu_item_id),
    movement_type: 'leftover_return',
    quantity_delta: Math.abs(quantity),
    note: item.note || 'Daily operations leftover return',
  };

  const movement = await insertWithSessionFallback('inventory_movements', payload);
  await adjustInventoryQuantity(inventory, Math.abs(quantity));
  return movement;
}

export async function createSupplierDebt(sessionId, debt) {
  ensureSupabase();
  const payload = {
    session_id: sessionId,
    supplier_id: debt.supplier_id || null,
    supplier_name: debt.supplier_name,
    item_supplied: debt.item_supplied,
    total_amount: Number(debt.total_amount || 0),
    paid_amount: Number(debt.paid_amount || 0),
    status: debt.status || getDebtStatus(debt.total_amount, debt.paid_amount),
    transaction_date: debt.transaction_date || TODAY(),
    due_date: debt.due_date || null,
    notes: debt.notes || null,
  };

  return insertWithSessionFallback('debts', payload);
}

export async function getOperationalSnapshot(businessDate = TODAY()) {
  ensureSupabase();
  const session = await getOrCreateDailySession(businessDate);
  const dayStart = `${businessDate}T00:00:00`;
  const dayEnd = `${businessDate}T23:59:59`;

  const [
    openingResponse,
    closingResponse,
    productionResponse,
    orderResponse,
    expenseResponse,
    debtResponse,
    movementResponse,
  ] = await Promise.all([
    supabase.from('stock_opening').select('*').eq('recorded_date', businessDate),
    supabase.from('stock_closing').select('*').eq('recorded_date', businessDate),
    supabase.from('production').select('*').gte('created_at', dayStart).lte('created_at', dayEnd),
    supabase
      .from('orders')
      .select('id, status, payment_status, created_at, order_items(quantity, menu_items(price))')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
    supabase.from('expenses').select('*').eq('recorded_date', businessDate),
    supabase.from('debts').select('*').eq('transaction_date', businessDate),
    supabase
      .from('inventory_movements')
      .select('id, menu_item_id, movement_type, quantity_delta, note, created_at, menu_items:menu_item_id(name)')
      .in('movement_type', ['waste', 'leftover_return'])
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
  ]);

  throwFirstError([
    openingResponse,
    closingResponse,
    productionResponse,
    orderResponse,
    expenseResponse,
    debtResponse,
    movementResponse,
  ]);

  return buildSnapshot({
    session,
    opening: openingResponse.data || [],
    closing: closingResponse.data || [],
    production: productionResponse.data || [],
    orders: orderResponse.data || [],
    expenses: expenseResponse.data || [],
    debts: debtResponse.data || [],
    movements: movementResponse.data || [],
  });
}

export async function getOperationalRangeMetrics(startDate, endDate) {
  ensureSupabase();
  const dayStart = `${startDate}T00:00:00`;
  const dayEnd = `${endDate}T23:59:59`;

  const [
    openingResponse,
    closingResponse,
    productionResponse,
    orderResponse,
    expenseResponse,
    debtResponse,
    movementResponse,
  ] = await Promise.all([
    supabase.from('stock_opening').select('*').gte('recorded_date', startDate).lte('recorded_date', endDate),
    supabase.from('stock_closing').select('*').gte('recorded_date', startDate).lte('recorded_date', endDate),
    supabase.from('production').select('*').gte('created_at', dayStart).lte('created_at', dayEnd),
    supabase
      .from('orders')
      .select('id, status, payment_status, created_at, order_items(quantity, menu_items(price))')
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
    supabase.from('expenses').select('*').gte('recorded_date', startDate).lte('recorded_date', endDate),
    supabase.from('debts').select('*').gte('transaction_date', startDate).lte('transaction_date', endDate),
    supabase
      .from('inventory_movements')
      .select('id, menu_item_id, movement_type, quantity_delta, note, created_at, menu_items:menu_item_id(name)')
      .in('movement_type', ['waste', 'leftover_return'])
      .gte('created_at', dayStart)
      .lte('created_at', dayEnd),
  ]);

  throwFirstError([
    openingResponse,
    closingResponse,
    productionResponse,
    orderResponse,
    expenseResponse,
    debtResponse,
    movementResponse,
  ]);

  return buildSnapshot({
    session: null,
    opening: openingResponse.data || [],
    closing: closingResponse.data || [],
    production: productionResponse.data || [],
    orders: orderResponse.data || [],
    expenses: expenseResponse.data || [],
    debts: debtResponse.data || [],
    movements: movementResponse.data || [],
  }).metrics;
}

function buildSnapshot({ session, opening, closing, production, orders, expenses, debts, movements }) {
  const paidOrders = orders.filter((order) => order.payment_status === 'paid');
  const revenue = paidOrders.reduce((sum, order) => {
    const orderTotal = (order.order_items || []).reduce(
      (itemSum, item) => itemSum + Number(item.quantity || 0) * Number(item.menu_items?.price || 0),
      0,
    );
    return sum + orderTotal;
  }, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDebt = debts.reduce((sum, item) => sum + Number(item.remaining_balance ?? item.total_amount ?? 0), 0);
  const waste = movements.filter((item) => item.movement_type === 'waste');
  const leftovers = movements.filter((item) => item.movement_type === 'leftover_return');
  const servedOrders = orders.filter((order) => ['served', 'delivered'].includes(order.status)).length;

  return {
    session,
    opening,
    closing,
    production,
    orders,
    expenses,
    debts,
    waste,
    leftovers,
    metrics: {
      openingItems: opening.length,
      closingItems: closing.length,
      productionItems: production.length,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      pendingOrders: orders.filter((order) => !['served', 'delivered', 'cancelled'].includes(order.status)).length,
      servedOrders,
      revenue,
      expenses: totalExpenses,
      debt: totalDebt,
      operatingProfit: revenue - totalExpenses,
      wasteQuantity: waste.reduce((sum, item) => sum + Math.abs(Number(item.quantity_delta || 0)), 0),
      leftoverQuantity: leftovers.reduce((sum, item) => sum + Math.abs(Number(item.quantity_delta || 0)), 0),
      serviceCompletionRate: orders.length > 0 ? Math.round((servedOrders / orders.length) * 100) : 0,
    },
  };
}

async function insertWithSessionFallback(tableName, payload) {
  const { data, error } = await supabase.from(tableName).insert([payload]).select().single();

  if (!error) return data;
  if (!isMissingColumnError(error)) throw error;

  const { session_id, ...fallbackPayload } = payload;
  const fallback = await supabase.from(tableName).insert([fallbackPayload]).select().single();
  if (fallback.error) throw fallback.error;
  return fallback.data;
}

function throwFirstError(responses) {
  for (const response of responses) {
    if (response.error) throw response.error;
  }
}

function getDebtStatus(totalAmount, paidAmount) {
  const total = Number(totalAmount || 0);
  const paid = Number(paidAmount || 0);
  if (paid >= total && total > 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

async function getInventoryForMenuItem(menuItemId) {
  const { data, error } = await supabase
    .from('inventory')
    .select('id, stock_quantity')
    .eq('menu_item_id', Number(menuItemId))
    .maybeSingle();

  if (error && !isMissingColumnError(error)) throw error;
  return data || null;
}

async function adjustInventoryQuantity(inventory, quantityDelta) {
  if (!inventory) return;

  const nextQuantity = Math.max(0, Number(inventory.stock_quantity || 0) + Number(quantityDelta || 0));
  const { error } = await supabase
    .from('inventory')
    .update({
      stock_quantity: nextQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', inventory.id);

  if (error) throw error;
}

export default {
  getOrCreateDailySession,
  updateSessionStatus,
  openSession,
  startClosing,
  closeSession,
  recordOpeningStock,
  recordClosingStock,
  recordWaste,
  recordLeftover,
  createSupplierDebt,
  getOperationalSnapshot,
  getOperationalRangeMetrics,
};
