import { useEffect, useState } from 'react';
import { Panel } from '../../../components/Panel';

export function DeliveryTab({ data, isLoading, onLoad, onUpdatePaymentStatus, notify }) {
  const [period, setPeriod] = useState('weekly');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    onLoad(period).catch(() => {});
  }, [onLoad, period]);

  const visibleDeliveries =
    paymentFilter === 'all'
      ? data.deliveries
      : data.deliveries.filter((delivery) => delivery.payment_status === paymentFilter);

  const togglePaymentStatus = async (delivery) => {
    const nextStatus = delivery.payment_status === 'paid' ? 'pending' : 'paid';

    try {
      await onUpdatePaymentStatus(delivery.id, nextStatus);
      notify(`Delivery marked as ${nextStatus}.`, 'success');
      await onLoad(period);
    } catch (error) {
      notify(error.message || 'Failed to update delivery payment status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Delivery & Operations</h2>
          <p className="text-sm text-ink/60">
            Review delivery activity, track assigned staff, and follow up on unpaid orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodFilter period={period} onChange={setPeriod} />
          <PaymentFilter paymentFilter={paymentFilter} onChange={setPaymentFilter} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Deliveries" value={data.deliveries.length} />
        <MetricCard label="Paid" value={data.paidCount} />
        <MetricCard label="Unpaid" value={data.unpaidCount} tone="text-red-600" />
      </div>

      <Panel title="Delivery Records" subtitle="Highlighting unpaid deliveries for faster follow-up.">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-ink/60">Loading delivery records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-ink/50">
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Items</th>
                  <th className="px-3 py-3 font-semibold">Waiter</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDeliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className={`border-b border-brand-50 ${
                      delivery.payment_status !== 'paid' ? 'bg-amber-50/70' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-ink">{delivery.customer_name}</p>
                      <p className="text-xs text-ink/55">{delivery.location}</p>
                    </td>
                    <td className="px-3 py-3 text-ink/75">{delivery.items}</td>
                    <td className="px-3 py-3 text-ink/75">{delivery.waiter_name || '--'}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          delivery.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {delivery.payment_status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink/75">
                      {new Date(delivery.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => togglePaymentStatus(delivery)}
                        className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-medium text-ink"
                      >
                        Mark {delivery.payment_status === 'paid' ? 'Pending' : 'Paid'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleDeliveries.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">
                No delivery records match the selected filters.
              </p>
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MetricCard({ label, value, tone = 'text-ink' }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function PeriodFilter({ period, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {['daily', 'weekly', 'monthly'].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            period === option ? 'bg-brand-500 text-white' : 'bg-brand-50 text-ink'
          }`}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}

function PaymentFilter({ paymentFilter, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {['all', 'paid', 'pending'].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            paymentFilter === option ? 'bg-brand-500 text-white' : 'bg-brand-50 text-ink'
          }`}
        >
          {option === 'all' ? 'All Payments' : option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}
