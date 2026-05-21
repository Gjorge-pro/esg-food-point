import { useState } from 'react';
import { Star } from 'lucide-react';

const statusClasses = {
  pending: 'app-status-pending',
  accepted: 'app-status-info',
  cooking: 'app-status-info',
  ready: 'app-status-success',
  on_the_way: 'app-status-info',
  delivered: 'app-status-success',
  served: 'app-status-success',
  cancelled: 'app-status-error',
};

const statusFlow = {
  pending: ['accepted'],
  accepted: ['cooking'],
  cooking: ['ready'],
  ready: (order) => order.order_type === 'delivery' ? ['on_the_way'] : ['served'],
  on_the_way: ['delivered'],
  delivered: [],
  served: [],
};

const getNextStatuses = (currentStatus, order) => {
  const next = statusFlow[currentStatus];
  if (typeof next === 'function') {
    return next(order);
  }
  return next || [];
};

export function OrderDetailPanel({ order, onStatusUpdate, onETAUpdate, onConfirmPayment }) {
  const [etaInput, setEtaInput] = useState(order.estimated_time_minutes || '');
  const [showEtaInput, setShowEtaInput] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const nextStatuses = getNextStatuses(order.status, order);
  const totalPrice = order.order_items?.reduce(
    (sum, item) => sum + Number(item.menu_items?.price || 0) * item.quantity,
    0
  ) || 0;

  const handleStatusClick = async (newStatus) => {
    setSyncing(true);
    await onStatusUpdate(order.id, newStatus);
    setSyncing(false);
  };

  const handleETASave = async () => {
    if (etaInput && parseInt(etaInput) > 0) {
      setSyncing(true);
      await onETAUpdate(order.id, parseInt(etaInput));
      setShowEtaInput(false);
      setSyncing(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setSyncing(true);
    await onConfirmPayment(order.id);
    setSyncing(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Sync Status Indicator */}
      {syncing && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-sm font-semibold text-blue-700">⚡ Syncing changes to customer in real-time...</span>
        </div>
      )}

      {/* Order Header */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-ink">Order #{order.id}</h2>
          <span className={`rounded-full px-4 py-2 text-lg font-bold ${statusClasses[order.status] || 'app-surface-muted'}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Order Type & Time */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-ink/60">Type</p>
            <p className="font-semibold text-ink capitalize">
              {order.order_type === 'dine_in' ? '🪑 Dine In' : '🚚 Delivery'}
            </p>
          </div>
          <div>
            <p className="text-ink/60">Created</p>
            <p className="font-semibold text-ink">
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Status Action Buttons */}
        {nextStatuses.length > 0 && (
          <div className="flex gap-2 mt-4">
            {nextStatuses.map(status => (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                disabled={syncing}
                className="flex-1 px-3 py-2 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {syncing ? '⚡ Syncing...' : `Move to ${status.replace('_', ' ')}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h3 className="font-bold text-ink mb-4">Customer Details</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-ink/60">Name</p>
            <p className="font-semibold text-ink">{order.customer_name || 'Guest'}</p>
          </div>
          {order.phone && (
            <div>
              <p className="text-ink/60">Phone</p>
              <p className="font-semibold text-ink">{order.phone}</p>
            </div>
          )}
          {order.order_type === 'delivery' && order.address && (
            <div>
              <p className="text-ink/60">Delivery Address</p>
              <p className="font-semibold text-ink">{order.address}</p>
            </div>
          )}
          {order.order_type === 'dine_in' && order.table_number && (
            <div>
              <p className="text-ink/60">Table Number</p>
              <p className="font-semibold text-ink">{order.table_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h3 className="font-bold text-ink mb-4">Items ({order.order_items?.length || 0})</h3>
        <div className="space-y-3">
          {order.order_items?.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="rounded-lg border border-brand-100 bg-brand-50 p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-ink">{item.menu_items?.name}</p>
                  {item.instructions && (
                    <p className="text-xs text-ink/60 mt-1">📝 {item.instructions}</p>
                  )}
                </div>
                <span className="font-bold text-brand-500">x{item.quantity}</span>
              </div>
              <p className="text-sm text-ink/60">
                {(Number(item.menu_items?.price || 0) * item.quantity).toLocaleString()} TSH
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ETA Management */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink">Estimated Time</h3>
          <button
            onClick={() => setShowEtaInput(!showEtaInput)}
            disabled={syncing}
            className="text-brand-500 hover:text-brand-600 font-semibold text-sm disabled:opacity-50"
          >
            {showEtaInput ? 'Cancel' : 'Update'}
          </button>
        </div>

        {showEtaInput ? (
          <div className="flex gap-2">
            <input
              type="number"
              value={etaInput}
              onChange={(e) => setEtaInput(e.target.value)}
              min="1"
              max="180"
              disabled={syncing}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              placeholder="Minutes"
            />
            <button
              onClick={handleETASave}
              disabled={syncing}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 active:scale-95"
            >
              {syncing ? '⚡' : 'Save'}
            </button>
          </div>
        ) : (
          <p className="text-2xl font-bold text-brand-500">
            {order.estimated_time_minutes} minutes ⏱️
          </p>
        )}
      </div>

      {/* Payment Information */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h3 className="font-bold text-ink mb-4">Payment</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-ink/60">Method</span>
            <span className="font-semibold text-ink capitalize">
              {order.payment_method?.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between border-b border-[var(--border)] pb-3">
            <span className="text-ink/60">Status</span>
            <span className={`font-semibold ${
              order.payment_status === 'paid' ? 'text-green-600' : 'text-amber-600'
            }`}>
              {order.payment_status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-bold text-ink">Total</span>
            <span className="font-bold text-brand-600">
              {totalPrice.toLocaleString()} TSH
            </span>
          </div>

          {order.payment_status === 'pending' && order.payment_method !== 'cash' && (
            <button
              onClick={handlePaymentConfirm}
              disabled={syncing}
              className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50"
            >
              {syncing ? '⚡ Confirming...' : '✓ Confirm Payment Received'}
            </button>
          )}
        </div>
      </div>

      {/* Feedback (if exists) */}
      {order.feedback && order.feedback.length > 0 && (
        <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Star className="text-amber-600" size={20} />
            <h3 className="font-bold text-ink">Customer Feedback</h3>
          </div>
          {order.feedback.map((fb, idx) => (
            <div key={idx}>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < fb.rating ? '⭐' : '☆'} />
                ))}
              </div>
              {fb.comment && (
                <p className="text-sm text-ink/70 italic">"{fb.comment}"</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
