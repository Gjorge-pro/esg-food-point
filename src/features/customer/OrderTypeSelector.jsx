import { ShoppingBag, Truck } from 'lucide-react';

export function OrderTypeSelector({ onSelect }) {
  return (
    <div className="app-hero flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-2">How would you like to order?</h1>
          <p className="text-white/75 dark:text-gray-400">Choose your preferred service type</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dine In Option */}
          <button
            onClick={() => onSelect('dine_in')}
            className="group relative overflow-hidden rounded-3xl border-2 border-transparent bg-white/10 dark:bg-gray-700/30 p-8 transition hover:border-brand-200 hover:bg-white/20 dark:hover:bg-gray-600/40"
          >
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="rounded-full bg-brand-100/20 dark:bg-brand-900/30 p-4 transition group-hover:bg-brand-100/30 dark:group-hover:bg-brand-800/40">
                <ShoppingBag className="text-brand-100 dark:text-brand-300" size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white dark:text-gray-100">Dine In</h2>
                <p className="mt-1 text-sm text-white/70 dark:text-gray-400">Eat at our restaurant</p>
              </div>
              <p className="mt-2 text-xs text-white/60 dark:text-gray-500">Get seated and enjoy your meal</p>
            </div>
          </button>

          {/* Delivery Option */}
          <button
            onClick={() => onSelect('delivery')}
            className="group relative overflow-hidden rounded-3xl border-2 border-transparent bg-white/10 dark:bg-gray-700/30 p-8 transition hover:border-brand-200 hover:bg-white/20 dark:hover:bg-gray-600/40"
          >
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="rounded-full bg-brand-100/20 dark:bg-brand-900/30 p-4 transition group-hover:bg-brand-100/30 dark:group-hover:bg-brand-800/40">
                <Truck className="text-brand-100 dark:text-brand-300" size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white dark:text-gray-100">Delivery</h2>
                <p className="mt-1 text-sm text-white/70 dark:text-gray-400">Get it delivered</p>
              </div>
              <p className="mt-2 text-xs text-white/60 dark:text-gray-500">We'll bring your food to you</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
