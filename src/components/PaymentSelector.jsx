import { CreditCard, Banknote, Smartphone } from 'lucide-react';

export function PaymentSelector({ selectedMethod, onSelectMethod, paymentStatus }) {
  const methods = [
    {
      id: 'cash',
      name: 'Cash on Delivery',
      icon: Banknote,
      color: 'bg-emerald-50 border-emerald-200',
      activeColor: 'bg-emerald-100 border-emerald-500',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      color: 'bg-amber-50 border-amber-200',
      activeColor: 'bg-amber-100 border-amber-500',
      iconColor: 'text-amber-600'
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: CreditCard,
      color: 'bg-[var(--bg-main)] border-[var(--border)]',
      activeColor: 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]',
      iconColor: 'text-[var(--color-primary)]'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methods.map(method => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const containerClass = isSelected
            ? `${method.activeColor} ring-2 ring-offset-2 ring-current`
            : method.color;

          return (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              disabled={paymentStatus === 'processing'}
              className={`
                flex items-center gap-3 p-4 rounded-2xl border-2
                transition-all duration-200 cursor-pointer
                hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                ${containerClass}
              `}
            >
              <Icon size={24} className={method.iconColor} />
              <div className="text-left">
                <p className="font-semibold text-sm text-[var(--text-primary)]">{method.name}</p>
                {method.id === 'cash' && <p className="text-xs text-[var(--text-secondary)]">Pay at counter</p>}
                {method.id === 'mobile_money' && <p className="text-xs text-[var(--text-secondary)]">M-Pesa, Airtel</p>}
                {method.id === 'card' && <p className="text-xs text-[var(--text-secondary)]">Visa, Mastercard</p>}
              </div>
              {isSelected && (
                <div className="ml-auto w-5 h-5 rounded-full bg-current flex items-center justify-center">
                  <span className="text-white dark:text-gray-900 text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
