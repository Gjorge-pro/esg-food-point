import { AlertCircle, Zap, Check, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const requestIcons = {
  call_waiter: '📞',
  request_bill: '💳',
};

const requestLabels = {
  call_waiter: 'Call Waiter',
  request_bill: 'Request Bill',
};

export function RequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending or all

  useEffect(() => {
    fetchRequests();
    return subscribeToRequests();
  }, []);

  const fetchRequests = async () => {
    if (!supabase) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          id,
          order_id,
          type,
          status,
          created_at,
          orders(
            id,
            customer_name,
            table_number,
            order_type,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      console.log('✅ Requests loaded:', data?.length);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToRequests = () => {
    if (!supabase) return;

    const channel = supabase
      .channel('requests-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          console.log('🔔 Request update:', payload.eventType);
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const markFulfilled = async (requestId) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'fulfilled' })
        .eq('id', requestId);

      if (error) throw error;

      // Optimistic update
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'fulfilled' } : req
        )
      );

      console.log(`✅ Request ${requestId} marked as fulfilled`);
    } catch (err) {
      console.error('Error marking request fulfilled:', err);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === 'pending';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const callWaiterCount = requests.filter(r => r.type === 'call_waiter' && r.status === 'pending').length;
  const billCount = requests.filter(r => r.type === 'request_bill' && r.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-100 mx-auto mb-4"></div>
          <p className="text-ink/60">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <Zap className="mb-3 text-ink/25" size={40} />
        <p className="text-center font-semibold text-ink/60">No requests</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header with filters */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-brand-500" size={24} />
          <h2 className="text-xl font-bold text-ink">Requests ({pendingCount})</h2>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'pending'
                ? 'bg-brand-500 text-white'
                : 'bg-brand-50 text-ink hover:bg-brand-100'
            }`}
          >
            🔴 Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-brand-500 text-white'
                : 'bg-brand-50 text-ink hover:bg-brand-100'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Requests list */}
      {filteredRequests.length === 0 ? (
        <div className="py-8 text-center text-ink/60">
          No {filter === 'pending' ? 'pending' : ''} requests
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(request => (
            <div
              key={request.id}
              className={`border-l-4 rounded-lg p-4 transition ${
                request.status === 'pending'
                  ? 'bg-amber-50 border-l-amber-500 shadow-md'
                  : 'bg-green-50 border-l-green-500 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Type + customer */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">
                      {requestIcons[request.type]}
                    </span>
                    <div>
                      <h3 className="font-bold text-ink">
                        {requestLabels[request.type]}
                      </h3>
                      <p className="text-sm text-ink/65">
                        {request.orders?.customer_name || 'Guest'} •{' '}
                        {request.orders?.order_type === 'dine_in'
                          ? `🪑 Table ${request.orders?.table_number}`
                          : `🚚 Delivery`}
                      </p>
                    </div>
                  </div>

                  {/* Time + status */}
                  <div className="flex items-center gap-2 text-xs text-ink/65">
                    <span>Order #{request.order_id}</span>
                    <span>•</span>
                    <span>
                      {new Date(request.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <button
                    onClick={() => markFulfilled(request.id)}
                    className="app-btn-success ml-4 flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition"
                  >
                    <Check size={18} />
                    Done
                  </button>
                )}
                {request.status === 'fulfilled' && (
                  <div className="ml-4 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                    ✓ Done
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">📞 {callWaiterCount}</div>
          <p className="text-xs text-ink/65">Waiter Calls</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">💰 {billCount}</div>
          <p className="text-xs text-ink/65">Bill Requests</p>
        </div>
      </div>
    </div>
  );
}

export function RequestsPanelLegacy({ requests, orders, onRequestFulfilled }) {
  const getOrderInfo = (orderId) => {
    return orders.find(o => o.id === orderId);
  };

  if (requests.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <Zap className="mb-3 text-ink/25" size={40} />
        <p className="text-center font-semibold text-ink/60">No active requests</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
        <AlertCircle size={24} className="text-red-600" />
        Active Requests ({requests.length})
      </h2>

      <div className="space-y-3">
        {requests.map((request) => {
          const order = getOrderInfo(request.order_id);
          const icon = requestIcons[request.type] || '❓';
          const label = requestLabels[request.type] || 'Request';

          return (
            <div
              key={request.id}
              className="p-4 bg-red-50 border-2 border-red-200 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-bold text-ink">{label}</p>
                    <p className="text-xs text-ink/60">
                      {order?.order_type === 'dine_in'
                        ? `Table ${order?.table_number}`
                        : `Order #${request.order_id}`}
                    </p>
                  </div>
                </div>
              </div>

              {order && (
                <div className="bg-white rounded p-2 mb-3 text-xs">
                  <p className="font-semibold text-ink">
                    {order.customer_name || 'Guest'}
                  </p>
                  {order.phone && (
                    <p className="text-ink/60">📞 {order.phone}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => onRequestFulfilled(request.id)}
                className="w-full px-3 py-2 bg-brand-500 text-white rounded font-semibold hover:bg-brand-600 transition text-sm"
              >
                ✓ Mark as Handled
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
