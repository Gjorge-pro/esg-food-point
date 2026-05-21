import { useCallback, useEffect, useState } from 'react';
import { Clock, MapPin, Phone, TrendingUp } from 'lucide-react';
import { ToastContainer, useToast } from '../components/Toast';
import { supabase } from '../lib/supabaseClient';

export function OrderHistoryPage() {
  const [phone, setPhone] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  const fetchOrdersByPhone = useCallback(
    async (phoneNumber, options = {}) => {
      const { showFoundToast = false, showLiveToast = false } = options;
      const trimmedPhone = phoneNumber.trim();

      if (!trimmedPhone) {
        setOrders([]);
        setSelectedOrder(null);
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, menu_items(id, name, price)),
          feedback(id, rating, comment)
        `)
        .eq('phone', trimmedPhone)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(data || []);
      setSelectedOrder((currentOrder) => {
        if (!currentOrder) return null;
        return data.find((order) => order.id === currentOrder.id) || null;
      });

      if ((data || []).length === 0) {
        setError('No orders found with this phone number');
      } else {
        setError('');

        if (showFoundToast) {
          addToast(`Found ${data.length} order(s)`, 'success');
        }

        if (showLiveToast) {
          addToast('Order history updated live', 'info');
        }
      }

      return data || [];
    },
    [addToast],
  );

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!phone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    setOrders([]);
    setSelectedOrder(null);

    try {
      const trimmedPhone = phone.trim();
      setSearchedPhone(trimmedPhone);
      await fetchOrdersByPhone(trimmedPhone, { showFoundToast: true });
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!searchedPhone || !supabase) return undefined;

    const channel = supabase
      .channel(`order-history-${searchedPhone}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `phone=eq.${searchedPhone}`,
        },
        async () => {
          try {
            await fetchOrdersByPhone(searchedPhone, { showLiveToast: true });
          } catch (err) {
            setError(err.message || 'Failed to refresh orders');
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchOrdersByPhone, searchedPhone]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'app-status-pending',
      accepted: 'app-status-info',
      cooking: 'app-status-info',
      ready: 'app-status-success',
      on_the_way: 'app-status-info',
      served: 'app-status-success',
      delivered: 'app-status-success',
      cancelled: 'app-status-error',
    };

    return colors[status] || 'app-surface-muted';
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      <div className="w-full min-h-screen bg-[var(--bg-main)] p-4 md:p-6">
        <div className="w-full space-y-6 px-4 md:px-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">Order History</h1>
            <p className="text-[var(--text-secondary)]">Look up your past orders</p>
          </div>

          <form
            onSubmit={handleSearch}
            className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm md:p-6"
          >
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
                Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+255XXXXXXXXX"
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="whitespace-nowrap rounded-xl bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-red-600 dark:text-red-200">{error}</p>
            </div>
          )}

          {selectedOrder ? (
            <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm md:p-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="font-semibold text-brand-500 hover:text-brand-600"
                >
                  Back
                </button>
                <h2 className="text-2xl font-bold text-ink">Order #{selectedOrder.id}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-ink/60">Status</p>
                  <p
                    className={`inline-block rounded-lg px-4 py-2 text-sm font-semibold ${getStatusColor(
                      selectedOrder.status,
                    )}`}
                  >
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-ink/60">Order Date</p>
                  <p className="font-semibold text-ink">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-ink/60">Type</p>
                  <p className="font-semibold text-ink">
                    {selectedOrder.order_type === 'dine_in' ? 'Dine In' : 'Delivery'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-ink/60">Est. Wait Time</p>
                  <p className="font-semibold text-ink">
                    {selectedOrder.estimated_time_minutes} minutes
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-ink">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between rounded-lg bg-brand-50 p-3">
                      <div>
                        <p className="font-semibold text-ink">{item.menu_items.name}</p>
                        {item.instructions && (
                          <p className="text-sm text-ink/60">Note: {item.instructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-ink">x{item.quantity}</p>
                        <p className="text-sm text-ink/60">
                          {Number(item.menu_items.price).toLocaleString()} TSH
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-brand-200 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-ink">Total</p>
                  <p className="text-2xl font-bold text-brand-500">
                    {Number(
                      selectedOrder.order_items.reduce(
                        (sum, item) => sum + Number(item.menu_items.price) * item.quantity,
                        0,
                      ),
                    ).toLocaleString()}{' '}
                    TSH
                  </p>
                </div>
              </div>

              {selectedOrder.feedback && selectedOrder.feedback.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-semibold text-ink">Your Rating:</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, index) => (
                        <span
                          key={index}
                          className={`text-lg ${
                            index < selectedOrder.feedback[0].rating
                              ? 'text-amber-400'
                              : 'text-ink/20'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedOrder.feedback[0].comment && (
                    <p className="text-sm text-ink/70">{selectedOrder.feedback[0].comment}</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.length > 0
                ? orders.map((order) => {
                    const total = order.order_items.reduce(
                      (sum, item) => sum + Number(item.menu_items.price) * item.quantity,
                      0,
                    );

                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left shadow-sm transition hover:shadow-md"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-ink">Order #{order.id}</p>
                            <p className="text-sm text-ink/60">{formatDate(order.created_at)}</p>
                          </div>
                          <span
                            className={`rounded-lg px-3 py-1 text-sm font-semibold ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-brand-500" />
                            <span className="text-ink/60">{order.order_items.length} item(s)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {order.order_type === 'delivery' ? (
                              <>
                                <MapPin size={16} className="text-brand-500" />
                                <span className="text-ink/60">Delivery</span>
                              </>
                            ) : (
                              <>
                                <Phone size={16} className="text-brand-500" />
                                <span className="text-ink/60">Dine In</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <TrendingUp size={16} className="text-brand-500" />
                            <span className="font-semibold text-ink">
                              {Number(total).toLocaleString()} TSH
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                : null}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
