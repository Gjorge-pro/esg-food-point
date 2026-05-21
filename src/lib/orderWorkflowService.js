// Order workflow service – handles status transitions with side‑effects
import { supabase } from './supabaseClient';
import { updateStockAfterOrder } from '../lib/inventoryService';
import { allocateProduction, revertProduction } from '../services/productionService';
import { restoreStockAfterCancellation } from '../services/inventoryAdjustmentService';

export const ORDER_FLOW = {
  pending: ['accepted'],
  accepted: ['cooking'],
  cooking: ['ready'],
  ready: ['on_the_way', 'served'],
  on_the_way: ['delivered'],
  served: [],
  delivered: [],
  cancelled: [],
  waste: [],
};

export function getAllowedNextStatuses(currentStatus, orderType) {
  const allowed = ORDER_FLOW[currentStatus] || [];
  if (currentStatus === 'ready') {
    return orderType === 'delivery'
      ? allowed.filter((s) => s === 'on_the_way')
      : allowed.filter((s) => s === 'served');
  }
  return allowed;
}

export function isValidStatusTransition(currentStatus, nextStatus, orderType) {
  return getAllowedNextStatuses(currentStatus, orderType).includes(nextStatus);
}

export async function updateOrderStatus(orderOrId, newStatus) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const hasOrderSnapshot = typeof orderOrId === 'object' && orderOrId !== null;
  const order = hasOrderSnapshot ? orderOrId : null;
  const orderId = hasOrderSnapshot ? orderOrId.id : orderOrId;

  // If we only have the ID, fetch the full order first
  if (!hasOrderSnapshot) {
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, order_type')
      .eq('id', orderId)
      .single();
    if (fetchError) throw fetchError;
    return updateOrderStatus(data, newStatus);
  }

  // Validate the transition according to business rules
  if (!isValidStatusTransition(order.status, newStatus, order.order_type)) {
    throw new Error(`Invalid status transition: ${order.status} -> ${newStatus}`);
  }

  // Persist the new status
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .eq('status', order.status)
    .select()
    .single();
  if (error) throw error;

  // Execute side‑effects (inventory & production) for key statuses
  try {
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('id, menu_item_id, quantity')
      .eq('order_id', orderId);
    if (itemsError) throw itemsError;
    const orderItems = items || [];

    if (newStatus === 'accepted') {
      await updateStockAfterOrder(orderId, orderItems);
      await allocateProduction(orderId, orderItems);
    } else if (newStatus === 'cancelled' || newStatus === 'waste') {
      await restoreStockAfterCancellation(orderItems);
      const { data: allocations } = await supabase
        .from('production_usage')
        .select('batchId, menu_item_id, quantity')
        .eq('order_id', orderId);
      if (allocations?.length) {
        await revertProduction(allocations);
      }
    }
  } catch (sideErr) {
    console.error('Side‑effect error in order status update:', sideErr);
    // Continue – main status change succeeded
  }

  return data;
}

export default {
  ORDER_FLOW,
  getAllowedNextStatuses,
  isValidStatusTransition,
  updateOrderStatus,
};
