import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../components/Toast';
import { markPaymentStatus } from '../../lib/paymentService';
import { printReceipt } from '../../lib/receiptService';
import {
  getAllowedNextStatuses,
  updateOrderStatus as updateOrderStatusTransition,
} from '../../lib/orderWorkflowService';

const STATUS_COLORS = {
  pending: 'app-status-pending',
  accepted: 'app-status-info',
  cooking: 'app-status-info',
  ready: 'app-status-success',
  on_the_way: 'app-status-info',
  served: 'app-status-success',
  delivered: 'app-status-success',
  cancelled: 'app-status-error',
  waste: 'app-status-error',
};

const DINE_IN_WORKFLOW = ['pending', 'accepted', 'cooking', 'ready', 'served'];
const DELIVERY_WORKFLOW = ['pending', 'accepted', 'cooking', 'ready', 'on_the_way', 'delivered'];

export function OrdersPanel({ defaultFilter = 'all' }) {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState(defaultFilter);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;
  console.log('[OrdersPanel] render', {
    renderCount: renderCountRef.current,
    ordersCount: orders.length,
    selectedOrderId: selectedOrder?.id || null,
    updatingOrderId,
    time: new Date().toISOString(),
  });

  const fetchOrders = async () => {
    const startedAt = performance.now();
    console.log('[OrdersPanel] fetchOrders:before-request', {
      time: new Date().toISOString(),
    });
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          phone,
          address,
          table_number,
          order_type,
          status,
          payment_status,
          payment_method,
          estimated_time_minutes,
          created_at,
          order_items (
            id,
            quantity,
            instructions,
            menu_items (
              id,
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('[OrdersPanel] setOrders:full-reload', {
        count: data?.length || 0,
        firstOrder: data?.[0] || null,
        elapsedMs: Math.round(performance.now() - startedAt),
        time: new Date().toISOString(),
      });
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      addToast('Error loading orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const patchOrderState = (orderId, patch, source) => {
    console.log('[OrdersPanel] setOrders:patch', {
      source,
      orderId,
      patch,
      time: new Date().toISOString(),
    });

    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === orderId ? { ...order, ...patch } : order)),
    );

    setSelectedOrder((currentOrder) =>
      currentOrder?.id === orderId ? { ...currentOrder, ...patch } : currentOrder,
    );
  };

  useEffect(() => {
    if (!supabase) return undefined;

    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[OrdersPanel] realtime:INSERT', {
          orderId: payload.new?.id,
          status: payload.new?.status,
          paymentStatus: payload.new?.payment_status,
          time: new Date().toISOString(),
        });
        playNewOrderSound();
        addToast('New order received.', 'info');
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        console.log('[OrdersPanel] realtime:UPDATE', {
          orderId: payload.new?.id,
          oldStatus: payload.old?.status,
          newStatus: payload.new?.status,
          oldPaymentStatus: payload.old?.payment_status,
          newPaymentStatus: payload.new?.payment_status,
          time: new Date().toISOString(),
        });
        patchOrderState(payload.new.id, payload.new, 'realtime-update');
      })
      .subscribe((status) => {
        console.log('[OrdersPanel] realtime:subscription-status', {
          status,
          time: new Date().toISOString(),
        });
      });

    return () => {
      console.log('[OrdersPanel] realtime:cleanup', {
        time: new Date().toISOString(),
      });
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (order, newStatus) => {
    if (updatingOrderId) {
      console.log('[OrdersPanel] updateOrderStatus:blocked', {
        activeOrderId: updatingOrderId,
        attemptedOrderId: order.id,
        time: new Date().toISOString(),
      });
      return;
    }

    const startTime = performance.now();
    console.log('[OrdersPanel] updateOrderStatus:click', {
      orderId: order.id,
      fromStatus: order.status,
      toStatus: newStatus,
      time: new Date().toISOString(),
    });
    setUpdatingOrderId(order.id);
    patchOrderState(order.id, { status: newStatus }, 'optimistic-status');
    
    try {
      console.log('[OrdersPanel] updateOrderStatus:before-request', {
        orderId: order.id,
        toStatus: newStatus,
        time: new Date().toISOString(),
      });
      await updateOrderStatusTransition(order, newStatus);
      console.log('[OrdersPanel] updateOrderStatus:after-request', {
        orderId: order.id,
        toStatus: newStatus,
        elapsedMs: Math.round(performance.now() - startTime),
        time: new Date().toISOString(),
      });
      
      addToast(`Status updated to ${formatStatusLabel(newStatus)}`, 'success');
    } catch (err) {
      console.error('Error updating order:', err);
      patchOrderState(order.id, { status: order.status }, 'rollback-status');
      addToast(err.message || 'Error updating order', 'error');
    } finally {
      setUpdatingOrderId(null);
      console.log('[OrdersPanel] updateOrderStatus:complete', {
        orderId: order.id,
        elapsedMs: Math.round(performance.now() - startTime),
        time: new Date().toISOString(),
      });
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    if (updatingOrderId) {
      console.log('[OrdersPanel] updatePaymentStatus:blocked', {
        activeOrderId: updatingOrderId,
        attemptedOrderId: orderId,
        time: new Date().toISOString(),
      });
      return;
    }
    
    const startTime = performance.now();
    console.log('[OrdersPanel] updatePaymentStatus:click', {
      orderId,
      paymentStatus,
      time: new Date().toISOString(),
    });
    setUpdatingOrderId(orderId);
    patchOrderState(orderId, { payment_status: paymentStatus }, 'optimistic-payment');
    
    try {
      console.log('[OrdersPanel] updatePaymentStatus:before-request', {
        orderId,
        paymentStatus,
        time: new Date().toISOString(),
      });
      await markPaymentStatus(orderId, paymentStatus);
      console.log('[OrdersPanel] updatePaymentStatus:after-request', {
        orderId,
        paymentStatus,
        elapsedMs: Math.round(performance.now() - startTime),
        time: new Date().toISOString(),
      });
      
      addToast(`Payment marked as ${formatStatusLabel(paymentStatus)}`, 'success');
    } catch (err) {
      console.error('Error updating payment:', err);
      fetchOrders();
      addToast('Error updating payment', 'error');
    } finally {
      setUpdatingOrderId(null);
      console.log('[OrdersPanel] updatePaymentStatus:complete', {
        orderId,
        elapsedMs: Math.round(performance.now() - startTime),
        time: new Date().toISOString(),
      });
    }
  };

  const calculateOrderTotal = (items) =>
    items?.reduce((sum, item) => sum + (Number(item.menu_items?.price || 0) * item.quantity), 0) || 0;

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    if (filter === 'pending') return orders.filter((order) => order.status === 'pending');
    if (filter === 'in-progress') {
      return orders.filter((order) =>
        ['accepted', 'cooking', 'ready', 'on_the_way'].includes(order.status),
      );
    }
    if (filter === 'completed') {
      return orders.filter((order) => ['served', 'delivered'].includes(order.status));
    }
    if (filter === 'cancelled') {
      return orders.filter((order) => ['cancelled', 'waste'].includes(order.status));
    }
    return orders;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orders ({getFilteredOrders().length})</h2>
        <button
          onClick={fetchOrders}
          disabled={isLoading || Boolean(updatingOrderId)}
          className={`app-btn-primary rounded-lg px-4 py-2 font-semibold transition-all ${
            isLoading || updatingOrderId ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All', color: 'bg-brand-500' },
          { id: 'pending', label: 'Pending', color: 'bg-amber-500' },
          { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
          { id: 'completed', label: 'Completed', color: 'bg-green-600' },
          { id: 'cancelled', label: 'Cancelled/Waste', color: 'bg-red-600' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`rounded-lg px-4 py-2 font-semibold text-white transition-all ${
              filter === tab.id ? tab.color : 'bg-brand-200 text-ink hover:bg-brand-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-8 text-center text-ink/60">Loading orders...</div>
        ) : getFilteredOrders().length === 0 ? (
          <div className="rounded-lg bg-brand-50 py-8 text-center text-ink/60">
            No orders {filter !== 'all' ? `(${filter})` : ''}
          </div>
        ) : (
          getFilteredOrders().map((order) => {
            const total = calculateOrderTotal(order.order_items);
            const nextStatuses = getAvailableStatuses(order);
            const workflow = getWorkflowStatuses(order);
            const isOrderUpdating = updatingOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                  selectedOrder?.id === order.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-[var(--border)] bg-[var(--bg-card)]'
                }`}
                onClick={() =>
                  setSelectedOrder((previousOrder) => (previousOrder?.id === order.id ? null : order))
                }
              >
                <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-6">
                  <div>
                    <p className="text-xs font-semibold uppercase text-ink/60">Order ID</p>
                    <p className="text-lg font-bold text-brand-500">#{order.id}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-ink/60">Customer</p>
                    <p className="truncate font-semibold">{order.customer_name || 'Walk-in'}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-ink/60">Amount</p>
                    <p className="text-lg font-bold text-green-600">TSH {total.toFixed(0)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-ink/60">Time</p>
                    <p className="font-semibold">{formatTime(order.created_at)}</p>
                    <p className="text-xs text-ink/60">{formatDate(order.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-ink/60">Items</p>
                    <p className="text-lg font-bold">{order.order_items?.length || 0}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-ink/60">Status</p>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-sm font-bold ${
                        STATUS_COLORS[order.status] || 'app-surface-muted'
                      }`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div>
                      <h4 className="mb-2 text-lg font-bold">Order Items</h4>
                      <div className="space-y-2 rounded bg-brand-50 p-3">
                        <div className="grid grid-cols-4 gap-2 border-b border-brand-100 pb-2 text-sm font-bold text-ink/70">
                          <span>Item Name</span>
                          <span className="text-center">Price</span>
                          <span className="text-center">Qty</span>
                          <span className="text-right">Total</span>
                        </div>
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-2 text-sm">
                            <span className="font-semibold">{item.menu_items?.name || 'Unknown Item'}</span>
                            <span className="text-center">
                              TSH {Number(item.menu_items?.price || 0).toFixed(0)}
                            </span>
                            <span className="rounded bg-brand-100 px-2 text-center font-bold text-brand-700">
                              {item.quantity}
                            </span>
                            <span className="text-right font-bold text-green-600">
                              TSH {(Number(item.menu_items?.price || 0) * item.quantity).toFixed(0)}
                            </span>
                          </div>
                        ))}
                        {order.order_items?.some((item) => item.instructions) && (
                          <div className="mt-2 border-t pt-2 text-sm">
                            <p className="font-semibold text-ink/80">Special Instructions:</p>
                            {order.order_items
                              ?.filter((item) => item.instructions)
                              .map((item, idx) => (
                                <p key={idx} className="text-ink/70">
                                  {item.instructions}
                                </p>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 font-bold">Customer Details</h4>
                        <div className="space-y-1 text-sm">
                          {order.customer_name && (
                            <p>
                              <strong>Name:</strong> {order.customer_name}
                            </p>
                          )}
                          {order.phone && (
                            <p>
                              <strong>Phone:</strong> {order.phone}
                            </p>
                          )}
                          {order.order_type === 'dine_in' ? (
                            order.table_number && (
                              <p>
                                <strong>Table:</strong> {order.table_number}
                              </p>
                            )
                          ) : (
                            order.address && (
                              <p>
                                <strong>Address:</strong> {order.address}
                              </p>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 font-bold">Payment & Timing</h4>
                        <div className="space-y-1 text-sm">
                          <p>
                            <strong>Type:</strong> {order.order_type === 'delivery' ? 'Delivery' : 'Dine-In'}
                          </p>
                          <p>
                            <strong>Method:</strong> {order.payment_method || 'Not set'}
                          </p>
                          <p>
                            <strong>Payment:</strong>{' '}
                            <span
                              className={`ml-2 font-bold ${
                                order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'
                              }`}
                            >
                              {formatStatusLabel(order.payment_status)}
                            </span>
                          </p>
                          {order.estimated_time_minutes && (
                            <p>
                              <strong>ETA:</strong> {order.estimated_time_minutes} min
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded border-2 border-green-200 bg-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">TSH {total.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-lg border border-brand-200 bg-[var(--bg-card)] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h5 className="font-semibold text-ink">Order Stages</h5>
                          <span className="text-xs uppercase tracking-wide text-ink/60">
                            {order.order_type === 'delivery' ? 'Delivery flow' : 'Dine-in flow'}
                          </span>
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          {workflow.map((status) => (
                            <span
                              key={status}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                order.status === status
                                  ? STATUS_COLORS[status]
                                  : 'bg-brand-50 text-ink/60'
                              }`}
                            >
                              {formatStatusLabel(status)}
                            </span>
                          ))}
                        </div>

                        {nextStatuses.length > 0 ? (
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {nextStatuses.map((status) => (
                              <button
                                key={status}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateOrderStatus(order, status);
                                }}
                                disabled={Boolean(updatingOrderId)}
                                className={`app-btn-primary rounded-lg px-4 py-2 font-semibold transition-all ${
                                  updatingOrderId ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {isOrderUpdating ? 'Updating...' : getActionLabel(status)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-ink/60">This order has reached its final status.</p>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (order.payment_status !== 'paid' && !updatingOrderId) {
                              updatePaymentStatus(order.id, 'paid');
                            }
                          }}
                          disabled={order.payment_status === 'paid' || Boolean(updatingOrderId)}
                          className={`rounded-lg px-4 py-2 font-semibold text-white transition-all ${
                            order.payment_status === 'paid'
                              ? 'bg-green-600 opacity-80'
                              : updatingOrderId
                              ? 'bg-amber-600 opacity-50 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {isOrderUpdating ? 'Updating...' : order.payment_status === 'paid' ? 'Paid' : 'Mark as Paid'}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            printReceipt(order);
                          }}
                          className="rounded-lg border border-brand-200 px-4 py-2 font-semibold text-ink transition hover:bg-brand-50"
                        >
                          Print Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function playNewOrderSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);
  } catch {
    // Browsers may block audio before user interaction; realtime toast still appears.
  }
}

function getWorkflowStatuses(order) {
  return order.order_type === 'delivery' ? DELIVERY_WORKFLOW : DINE_IN_WORKFLOW;
}

function getAvailableStatuses(order) {
  return getAllowedNextStatuses(order.status, order.order_type);
}

function formatStatusLabel(status) {
  return String(status || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getActionLabel(status) {
  const labels = {
    accepted: 'Accept Order',
    cooking: 'Start Cooking',
    ready: 'Mark Ready',
    on_the_way: 'Send On The Way',
    served: 'Mark Served',
    delivered: 'Deliver',
  };

  return labels[status] || `Set ${formatStatusLabel(status)}`;
}
