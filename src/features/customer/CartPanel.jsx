import { Trash2, Plus, Minus } from 'lucide-react';

export function CartPanel({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, isLoading }) {
  const total = cartItems.reduce((sum, item) => {
    return sum + (Number(item.menuItem.price) * item.quantity);
  }, 0);

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <p className="text-ink/60 mb-4">Your cart is empty</p>
          <p className="text-sm text-ink/50">Add items from the menu to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cartItems.map((item) => (
          <div
            key={`${item.menuItemId}-${item.instructions}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:shadow-sm"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{item.menuItem.name}</h3>
                {item.instructions && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">📝 {item.instructions}</p>
                )}
              </div>
              <button
                onClick={() => onRemoveItem(item.menuItemId, item.instructions)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Item Footer */}
            <div className="flex items-center justify-between mt-3">
              {/* Quantity Controls */}
              <div className="flex items-center gap-2 bg-[var(--bg-main)] rounded-lg p-1 border border-[var(--border)]">
                <button
                  onClick={() => onUpdateQuantity(item.menuItemId, item.instructions, Math.max(1, item.quantity - 1))}
                  className="p-1 hover:bg-[var(--bg-card)] rounded transition duration-200"
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.menuItemId, item.instructions, item.quantity + 1)}
                  className="p-1 hover:bg-[var(--bg-card)] rounded transition duration-200"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Item Subtotal */}
              <p className="font-semibold text-brand-100">
                {(Number(item.menuItem.price) * item.quantity).toLocaleString()} TSH
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="space-y-2 border-t border-brand-100 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-ink">Total</p>
          <p className="text-xl font-bold text-brand-100">
            {total.toLocaleString()} TSH
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isLoading || cartItems.length === 0}
        className="w-full mt-4 px-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          'Proceed to Checkout'
        )}
      </button>
    </div>
  );
}
