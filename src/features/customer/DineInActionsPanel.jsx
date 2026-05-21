import { Bell, ReceiptText, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

export function DineInActionsPanel({ orderId, onCallWaiter, onRequestBill, isLoading }) {
  const [requests, setRequests] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleCallWaiter = async () => {
    const success = await onCallWaiter();
    if (success) {
      setRequests(prev => [...prev, {
        id: Date.now(),
        type: 'call_waiter',
        status: 'pending',
        createdAt: new Date()
      }]);
    }
  };

  const handleRequestBill = async () => {
    const success = await onRequestBill();
    if (success) {
      setRequests(prev => [...prev, {
        id: Date.now(),
        type: 'request_bill',
        status: 'pending',
        createdAt: new Date()
      }]);
    }
  };

  const getRequestLabel = (type) => {
    return type === 'call_waiter' ? '📞 Call Waiter' : '💳 Request Bill';
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const fulfilledRequests = requests.filter(r => r.status === 'fulfilled');

  return (
    <div className="space-y-4">
      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleCallWaiter}
          disabled={isLoading}
          className="group relative overflow-hidden rounded-2xl border-2 border-brand-200 dark:border-brand-700 bg-white dark:bg-gray-800 p-6 transition hover:border-brand-100 dark:hover:border-brand-600 hover:shadow-lg dark:hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 transition group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40">
              <Bell className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-gray-100">Call Waiter</h3>
            <p className="text-xs text-ink/60 dark:text-gray-400">Need assistance? We'll be right with you</p>
          </div>
        </button>

        <button
          onClick={handleRequestBill}
          disabled={isLoading}
          className="group relative overflow-hidden rounded-2xl border-2 border-brand-200 dark:border-brand-700 bg-white dark:bg-gray-800 p-6 transition hover:border-brand-100 dark:hover:border-brand-600 hover:shadow-lg dark:hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/40 transition">
              <ReceiptText className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-gray-100">Request Bill</h3>
            <p className="text-xs text-ink/60 dark:text-gray-400">Ready to pay? We'll bring it over</p>
          </div>
        </button>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Clock size={18} />
            Active Requests
          </h3>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-2 text-sm text-blue-900">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                <span>{getRequestLabel(req.type)} - Submitted</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fulfilled Requests */}
      {fulfilledRequests.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <CheckCircle size={18} />
            Fulfilled Requests
          </h3>
          <div className="space-y-2">
            {fulfilledRequests.map(req => (
              <div key={req.id} className="flex items-center gap-2 text-sm text-green-900">
                <CheckCircle size={16} />
                <span>{getRequestLabel(req.type)} - Completed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm text-ink/70">
          💡 <strong>Tip:</strong> You can make multiple requests. Our staff will attend to each one.
        </p>
      </div>
    </div>
  );
}
