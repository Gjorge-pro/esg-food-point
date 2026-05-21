const formatTimeAgo = (date) => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

const statusColors = {
  pending: 'app-status-pending',
  accepted: 'app-status-info',
  cooking: 'app-status-info',
  ready: 'app-status-success',
  on_the_way: 'app-status-info',
  served: 'app-status-success',
  delivered: 'app-status-success',
  cancelled: 'app-status-error',
};

const typeIcons = {
  dine_in: '🪑',
  delivery: '🚚',
};

export function OrdersList({ orders, selectedOrder, onSelectOrder, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ink/60 font-semibold">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <button
          key={order.id}
          onClick={() => onSelectOrder(order)}
          className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
            selectedOrder?.id === order.id
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md scale-[1.01]'
              : 'border-[var(--border)] bg-[var(--bg-card)] hover:shadow-md hover:scale-[1.005]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {typeIcons[order.order_type]}
              </span>
              <div>
                <p className="font-bold text-[var(--text-primary)]">#{order.id}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {formatTimeAgo(order.created_at)}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${
              statusColors[order.status] || statusColors.pending
            }`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Customer Info */}
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {order.customer_name || 'Guest'}
          </p>

          {/* Items Count & Payment */}
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>{order.order_items?.length || 0} items</span>
            <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
              order.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {order.payment_status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
