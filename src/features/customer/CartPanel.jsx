import { Trash2, Plus, Minus } from 'lucide-react';

export function CartPanel({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, isLoading }) {
  const total = cartItems.reduce((sum, item) => {
    return sum + (Number(item.menuItem.price) * item.quantity);
  }, 0);

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm text-ink/60 mb-2">Your cart is empty</p>
          <p className="text-xs text-ink/50">Add items from the menu to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Cart Items */}
      <div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto">
        {cartItems.map((item) => (
          <div
            key={`${item.menuItemId}-${item.instructions}`}
            className="rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4 transition-all duration-200 hover:shadow-sm"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate">{item.menuItem.name}</h3>
                {item.instructions && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">📝 {item.instructions}</p>
                )}
              </div>
              <button
                onClick={() => onRemoveItem(item.menuItemId, item.instructions)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Item Footer */}
            <div className="flex items-center justify-between mt-3 gap-2">
              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-[var(--bg-main)] rounded-lg p-1 border border-[var(--border)]">
                <button
                  onClick={() => onUpdateQuantity(item.menuItemId, item.instructions, Math.max(1, item.quantity - 1))}
                  className="p-1 hover:bg-[var(--bg-card)] rounded transition duration-200"
                >
                  <Minus size={14} />
                </button>
                <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.menuItemId, item.instructions, item.quantity + 1)}
                  className="p-1 hover:bg-[var(--bg-card)] rounded transition duration-200"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Item Subtotal */}
              <p className="font-semibold text-xs sm:text-sm text-brand-100 truncate">
                {(Number(item.menuItem.price) * item.quantity).toLocaleString()} TSH
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="space-y-2 border-t border-brand-100 pt-3 sm:pt-4 mt-3 sm:mt-4">
        <div className="flex items-center justify-between">
          <p className="font-bold text-xs sm:text-sm text-ink">Total</p>
          <p className="text-lg sm:text-xl font-bold text-brand-100">
            {total.toLocaleString()} TSH
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        disabled={isLoading || cartItems.length === 0}
        className="w-full mt-3 sm:mt-4 px-4 py-2 sm:py-3 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg sm:rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
