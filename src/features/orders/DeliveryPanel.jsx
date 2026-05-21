import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDeliveries } from '../../hooks/useDeliveries';
import { useToast } from '../../components/Toast';

export function DeliveryPanel() {
  const { addToast } = useToast();
  const { todayDeliveries, unpaidCount, addDelivery, updatePaymentStatus } = useDeliveries();
  const [formData, setFormData] = useState({
    customer_name: '',
    location: '',
    items: '',
    waiter_name: '',
    payment_status: 'pending'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await addDelivery(formData);
    if (result.success) {
      setFormData({
        customer_name: '',
        location: '',
        items: '',
        waiter_name: '',
        payment_status: 'pending'
      });
      addToast('✅ Delivery recorded', 'success');
    } else {
      addToast('❌ Error: ' + result.error, 'error');
    }
  };

  const handlePaymentToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const result = await updatePaymentStatus(id, newStatus);
    if (result.success) {
      addToast('Payment status updated ✅', 'success');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Delivery Tracking ({todayDeliveries.length})</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-100 p-3 rounded border-2 border-green-300">
          <p className="text-sm text-green-700">Delivered</p>
          <p className="text-2xl font-bold text-green-900">{todayDeliveries.length}</p>
        </div>
        <div className="bg-red-100 p-3 rounded border-2 border-red-300">
          <p className="text-sm text-red-700">Unpaid</p>
          <p className="text-2xl font-bold text-red-900">{unpaidCount}</p>
        </div>
      </div>

      {/* Add Delivery Form */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-bold mb-3">Add Delivery Record</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Customer name"
            value={formData.customer_name}
            onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Location/Address"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Items (e.g., 2x Rice, 1x Soda)"
            value={formData.items}
            onChange={(e) => setFormData({...formData, items: e.target.value})}
            className="w-full px-3 py-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Waiter name (optional)"
            value={formData.waiter_name}
            onChange={(e) => setFormData({...formData, waiter_name: e.target.value})}
            className="w-full px-3 py-2 border rounded"
          />
          <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <Plus size={16} className="inline mr-2" />
            Add Delivery
          </button>
        </form>
      </div>

      {/* Deliveries List */}
      <div className="space-y-2">
        {todayDeliveries.length === 0 ? (
          <p className="py-8 text-center text-ink/60">No deliveries recorded today</p>
        ) : (
          todayDeliveries.map(delivery => (
            <div key={delivery.id} className="bg-white p-3 rounded border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{delivery.customer_name}</p>
                  <p className="text-sm text-ink/65">{delivery.location}</p>
                </div>
                <button
                  onClick={() => handlePaymentToggle(delivery.id, delivery.payment_status)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    delivery.payment_status === 'paid'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {delivery.payment_status === 'paid' ? '✓ Paid' : '✗ Unpaid'}
                </button>
              </div>
              <p className="text-xs text-ink/60">{delivery.items}</p>
              {delivery.waiter_name && <p className="text-xs text-ink/60">Waiter: {delivery.waiter_name}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
