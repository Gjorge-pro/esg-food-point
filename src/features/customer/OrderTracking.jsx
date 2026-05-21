import { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { FeedbackModal } from '../../components/FeedbackModal';

export function OrderTracking({ order, isLoading, error, onFeedbackSubmitted }) {
  const [remainingTime, setRemainingTime] = useState(order?.estimated_time_minutes * 60 || 0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const displayOrder = order;
  const statusSteps = [
    { id: 'pending', label: 'Order Placed', icon: Clock },
    { id: 'accepted', label: 'Accepted', icon: CheckCircle },
    { id: 'cooking', label: 'Cooking', icon: CheckCircle },
    { id: 'ready', label: 'Ready', icon: CheckCircle },
    ...(displayOrder?.order_type === 'delivery'
      ? [{ id: 'on_the_way', label: 'On the Way', icon: CheckCircle }]
      : []),
    {
      id: displayOrder?.order_type === 'delivery' ? 'delivered' : 'served',
      label: displayOrder?.order_type === 'delivery' ? 'Delivered' : 'Served',
      icon: CheckCircle,
    },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.id === displayOrder?.status);
  const orderItems = displayOrder?.order_items || [];
  const isOrderComplete =
    displayOrder?.status === 'served' || displayOrder?.status === 'delivered';
  const etaMinutes = displayOrder?.estimated_time_minutes || 30;

  useEffect(() => {
    if (!displayOrder) return undefined;

    const createdAt = new Date(displayOrder.created_at).getTime();
    const estimatedMs = etaMinutes * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - createdAt;
      const remaining = Math.max(0, Math.floor((estimatedMs - elapsed) / 1000));
      setRemainingTime(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [displayOrder?.created_at, etaMinutes]);

  useEffect(() => {
    if (isOrderComplete && !feedbackOpen) {
      const timer = setTimeout(() => setFeedbackOpen(true), 1000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [feedbackOpen, isOrderComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-100"></div>
          <p className="mt-4 text-ink/60">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="font-semibold text-red-700">{error}</p>
      </div>
    );
  }

  if (!displayOrder) {
    return (
      <div className="py-8 text-center">
        <p className="text-ink/60">No order found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink/60">Order ID</p>
            <h1 className="text-3xl font-bold text-ink">#{displayOrder.id}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink/60">Order Type</p>
            <p className="text-lg font-semibold capitalize">
              {displayOrder.order_type === 'dine_in' ? 'Dine In' : 'Delivery'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-ink/60">Customer</p>
            <p className="font-semibold text-ink">{displayOrder.customer_name || 'Guest'}</p>
          </div>
          {displayOrder.order_type === 'delivery' && (
            <>
              <div>
                <p className="text-ink/60">Phone</p>
                <p className="font-semibold text-ink">{displayOrder.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-ink/60">Address</p>
                <p className="font-semibold text-ink">{displayOrder.address}</p>
              </div>
            </>
          )}
          {displayOrder.order_type === 'dine_in' && displayOrder.table_number && (
            <div>
              <p className="text-ink/60">Table</p>
              <p className="font-semibold text-ink">{displayOrder.table_number}</p>
            </div>
          )}
        </div>
      </div>

      {!isOrderComplete && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-brand-100">Estimated Time Remaining</p>
              <p className="font-mono text-4xl font-bold">{formatTime(remainingTime)}</p>
            </div>
            <Clock size={48} className="opacity-80" />
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-brand-400/50">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{
                width: `${Math.max(0, Math.min(100, (remainingTime / (etaMinutes * 60)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-brand-100 dark:border-brand-800 bg-white dark:bg-gray-800 p-6">
        <h2 className="mb-6 font-bold text-ink dark:text-gray-100">Order Status</h2>
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`rounded-full p-2 transition ${
                      isCompleted ? 'bg-brand-500 text-white' : 'bg-brand-50 text-ink/40'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`my-2 h-12 w-0.5 transition ${
                        isCompleted ? 'bg-brand-500' : 'bg-brand-50'
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1 py-2">
                  <p className={`font-semibold transition ${isCompleted ? 'text-ink' : 'text-ink/40'}`}>
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-1 text-xs font-medium text-white animate-pulse">
                        In Progress
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 dark:border-brand-800 bg-white dark:bg-gray-800 p-6">
        <h2 className="mb-4 font-bold text-ink dark:text-gray-100">Items</h2>
        <div className="space-y-3">
          {orderItems.map((item, itemIndex) => {
            const menuItem = item.menuItem || item.menu_items;

            return (
              <div
                key={item.id || itemIndex}
                className="flex items-center justify-between rounded-xl bg-brand-50 p-3"
              >
                <div className="flex-1">
                  <p className="font-semibold text-ink">{menuItem?.name || 'Item'}</p>
                  {item.instructions && (
                    <p className="mt-1 text-xs text-ink/60">{item.instructions}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">x{item.quantity}</p>
                  <p className="text-sm text-ink/60">
                    {(Number(menuItem?.price || 0) * item.quantity).toLocaleString()} TSH
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 dark:border-brand-800 bg-white dark:bg-gray-800 p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-t border-brand-200 dark:border-brand-800 pt-3">
            <span className="font-bold text-ink dark:text-gray-100">Total</span>
            <span className="text-2xl font-bold text-brand-500 dark:text-brand-400">
              {Number(
                orderItems.reduce((sum, item) => {
                  const menuItem = item.menuItem || item.menu_items;
                  return sum + Number(menuItem?.price || 0) * item.quantity;
                }, 0),
              ).toLocaleString()}{' '}
              TSH
            </span>
          </div>
          {displayOrder.payment_method && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">Payment Method</span>
              <span className="font-semibold capitalize text-ink">
                {displayOrder.payment_method.replace('_', ' ')}
              </span>
            </div>
          )}
          {displayOrder.payment_status && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">Payment Status</span>
              <span
                className={`font-semibold capitalize ${
                  displayOrder.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {displayOrder.payment_status}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl border-l-4 p-4 ${
          isOrderComplete ? 'border-l-emerald-500 bg-emerald-50' : 'border-l-brand-500 bg-blue-50'
        }`}
      >
        <p className={`text-sm ${isOrderComplete ? 'text-emerald-900' : 'text-blue-900'}`}>
          {getStatusMessage(displayOrder.status, displayOrder.order_type)}
        </p>
      </div>

      <FeedbackModal
        order={displayOrder}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmitSuccess={() => {
          onFeedbackSubmitted?.();
        }}
      />
    </div>
  );
}

function getStatusMessage(status, orderType) {
  switch (status) {
    case 'pending':
      return "Your order is being confirmed. We'll get started soon!";
    case 'accepted':
      return 'Your order has been accepted and is being prepared.';
    case 'cooking':
      return 'Your food is being cooked with care.';
    case 'ready':
      return orderType === 'dine_in'
        ? 'Your order is ready. A waiter will bring it shortly.'
        : 'Your order is ready for delivery.';
    case 'on_the_way':
      return 'Your food is on the way to you.';
    case 'delivered':
    case 'served':
      return 'Order complete. Enjoy your meal!';
    default:
      return 'Order status updated.';
  }
}
