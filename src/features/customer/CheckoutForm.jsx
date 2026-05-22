import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PaymentSelector } from '../../components/PaymentSelector';

export function CheckoutForm({ orderType, onBack, onSubmit, isLoading }) {
  const [formData, setFormData] = React.useState({
    customerName: '',
    phone: '',
    address: '',
    tableNumber: '',
    paymentMethod: 'cash'
  });

  const [errors, setErrors] = React.useState({});
  const [paymentStatus, setPaymentStatus] = React.useState('idle');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (orderType === 'delivery') {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone is required';
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        customerName: formData.customerName.trim(),
        phone: orderType === 'delivery' ? formData.phone.trim() : '',
        address: orderType === 'delivery' ? formData.address.trim() : '',
        tableNumber: orderType === 'dine_in' ? formData.tableNumber.trim() : '',
        paymentMethod: formData.paymentMethod,
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-xs sm:text-sm text-ink/60 hover:text-ink transition"
      >
        <ArrowLeft size={18} />
        <span>Back to Cart</span>
      </button>

      {/* Order Type Info */}
      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
        <p className="text-xs sm:text-sm text-blue-900 font-semibold">
          {orderType === 'dine_in' ? '🪑 Dine-in Order' : '🚚 Delivery Order'}
        </p>
      </div>

      {/* Customer Name */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-[var(--text-primary)] mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={formData.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          placeholder="Enter your name"
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border outline-none transition-all duration-200 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] ${
            errors.customerName
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-[var(--border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
          }`}
        />
        {errors.customerName && (
          <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
        )}
      </div>

      {/* Dine-In Specific Fields */}
      {orderType === 'dine_in' && (
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[var(--text-primary)] mb-2">
            Table Number (Optional)
          </label>
          <input
            type="text"
            value={formData.tableNumber}
            onChange={(e) => handleChange('tableNumber', e.target.value)}
            placeholder="e.g., A1, 5, Corner"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] outline-none transition-all duration-200 text-sm placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">We'll bring your order to your table</p>
        </div>
      )}

      {/* Delivery Specific Fields */}
      {orderType === 'delivery' && (
        <>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[var(--text-primary)] mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+254 (or local number)"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border outline-none transition-all duration-200 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] ${
                errors.phone
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-[var(--border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[var(--text-primary)] mb-2">
              Delivery Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your full delivery address with landmarks"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border outline-none transition-all duration-200 resize-none h-20 sm:h-24 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] ${
                errors.address
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-[var(--border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)]'
              }`}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>
        </>
      )}

      {/* Payment Selector */}
      <PaymentSelector
        selectedMethod={formData.paymentMethod}
        onSelectMethod={(method) => handleChange('paymentMethod', method)}
        paymentStatus={paymentStatus}
      />

      {errors.paymentMethod && (
        <p className="text-red-500 text-xs sm:text-sm">{errors.paymentMethod}</p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || paymentStatus === 'processing'}
        className="w-full px-4 py-3 bg-[var(--color-primary)] text-white rounded-lg sm:rounded-xl font-bold text-sm hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
      >
        {isLoading || paymentStatus === 'processing' ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          'Place Order'
        )}
      </button>
    </form>
  );
}
