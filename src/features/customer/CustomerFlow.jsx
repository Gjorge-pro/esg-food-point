import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { ToastContainer, useToast } from '../../components/Toast';
import { ThemeToggle } from '../../components/ThemeToggle';
import { CartPanel } from './CartPanel';
import { CheckoutForm } from './CheckoutForm';
import { DineInActionsPanel } from './DineInActionsPanel';
import { MenuBrowser } from './MenuBrowser';
import { OrderTracking } from './OrderTracking';
import { OrderTypeSelector } from './OrderTypeSelector';
import { updateStockAfterOrder } from '../../lib/inventoryService';

const FLOW_STEPS = {
  ORDER_TYPE: 'orderType',
  MENU: 'menu',
  CHECKOUT: 'checkout',
  TRACKING: 'tracking',
};

export function CustomerFlow({ isConfigured }) {
  const [flowStep, setFlowStep] = useState(FLOW_STEPS.ORDER_TYPE);
  const [orderType, setOrderType] = useState(null);
  const [cart, setCart] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!currentOrder?.id || !supabase) return undefined;

    const channel = supabase
      .channel(`orders-${currentOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${currentOrder.id}`,
        },
        (payload) => {
          setCurrentOrder((previousOrder) => {
            if (!previousOrder || previousOrder.id !== payload.new.id) {
              return previousOrder;
            }

            return {
              ...previousOrder,
              ...payload.new,
            };
          });

          if (payload.old.status !== payload.new.status) {
            addToast(getStatusToastMessage(payload.new.status, payload.new.order_type), 'info');
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [addToast, currentOrder?.id]);

  const handleSelectOrderType = (type) => {
    setOrderType(type);
    setFlowStep(FLOW_STEPS.MENU);
    addToast(`${type === 'dine_in' ? 'Dine-in' : 'Delivery'} order started`, 'info');
  };

  const handleAddToCart = (item) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (cartItem) => cartItem.menuItemId === item.menuItemId && cartItem.instructions === item.instructions,
      );

      if (existingItem) {
        return previousCart.map((cartItem) =>
          cartItem.menuItemId === item.menuItemId && cartItem.instructions === item.instructions
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem,
        );
      }

      return [...previousCart, item];
    });

    addToast(`${item.menuItem.name} added to cart`, 'success');
  };

  const handleUpdateQuantity = (menuItemId, instructions, newQuantity) => {
    if (newQuantity === 0) {
      handleRemoveItem(menuItemId, instructions);
      return;
    }

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.menuItemId === menuItemId && item.instructions === instructions
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const handleRemoveItem = (menuItemId, instructions) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => !(item.menuItemId === menuItemId && item.instructions === instructions),
      ),
    );
    addToast('Item removed from cart', 'info');
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      addToast('Please add items to your cart', 'error');
      return;
    }

    setFlowStep(FLOW_STEPS.CHECKOUT);
  };

  const handlePlaceOrder = async (customerDetails) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_type: orderType,
            customer_name: customerDetails.customerName,
            phone: customerDetails.phone || null,
            address: customerDetails.address || null,
            table_number: customerDetails.tableNumber || null,
            payment_method: customerDetails.paymentMethod || 'cash',
            payment_status: 'pending',
            estimated_time_minutes: Math.floor(Math.random() * 20) + 20,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        instructions: item.instructions || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      updateStockAfterOrder(order.id, orderItems).catch((stockError) => {
        console.error('Failed to update stock after order:', stockError);
      });

      setCurrentOrder({
        ...order,
        order_items: cart.map((item, index) => ({
          id: `local-${order.id}-${index}`,
          quantity: item.quantity,
          instructions: item.instructions || null,
          menuItemId: item.menuItemId,
          menuItem: item.menuItem,
          menu_items: item.menuItem,
        })),
      });
      setFlowStep(FLOW_STEPS.TRACKING);
      setCart([]);

      window.localStorage.setItem('esg-current-order-id', String(order.id));
      addToast('Order placed successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to place order');
      addToast(`Failed to place order: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallWaiter = async () => {
    try {
      const { error } = await supabase.from('requests').insert([
        {
          order_id: currentOrder.id,
          type: 'call_waiter',
          status: 'pending',
        },
      ]);

      if (error) throw error;
      addToast("Waiter called! We'll be right with you.", 'success');
      return true;
    } catch {
      addToast('Failed to call waiter', 'error');
      return false;
    }
  };

  const handleRequestBill = async () => {
    try {
      const { error } = await supabase.from('requests').insert([
        {
          order_id: currentOrder.id,
          type: 'request_bill',
          status: 'pending',
        },
      ]);

      if (error) throw error;
      addToast("Bill requested! It's on the way.", 'success');
      return true;
    } catch {
      addToast('Failed to request bill', 'error');
      return false;
    }
  };

  const resetOrderFlow = () => {
    setFlowStep(FLOW_STEPS.ORDER_TYPE);
    setOrderType(null);
    setCart([]);
    setCurrentOrder(null);
    window.localStorage.removeItem('esg-current-order-id');
  };

  const renderContent = () => {
    switch (flowStep) {
      case FLOW_STEPS.ORDER_TYPE:
        return <OrderTypeSelector onSelect={handleSelectOrderType} />;

      case FLOW_STEPS.MENU:
        return (
          <div className="min-h-screen pt-16 sm:pt-0">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <button
                    onClick={resetOrderFlow}
                    className="mb-3 sm:mb-4 flex items-center gap-2 text-[var(--text-secondary)] transition-all duration-200 hover:text-[var(--text-primary)] text-sm"
                  >
                    <ArrowLeft size={18} />
                    <span className="font-medium">Change order type</span>
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Menu</h1>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Items in cart</p>
                  <p className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{cart.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-4">
                <div className="lg:col-span-3">
                  <MenuBrowser onAddToCart={handleAddToCart} />
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-16 sm:top-4 rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-sm">
                    <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-bold text-[var(--text-primary)]">Your Cart</h2>
                    <CartPanel
                      cartItems={cart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onCheckout={handleProceedToCheckout}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case FLOW_STEPS.CHECKOUT:
        return (
          <div className="min-h-screen pt-16 sm:pt-0">
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
              <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6 md:p-8 shadow-sm max-w-4xl mx-auto">
                <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Checkout</h1>

                <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
                  <div className="min-w-0">
                    <CheckoutForm
                      orderType={orderType}
                      onBack={() => setFlowStep(FLOW_STEPS.MENU)}
                      onSubmit={handlePlaceOrder}
                      isLoading={isLoading}
                    />
                  </div>

                  <div className="h-fit rounded-xl bg-[var(--bg-main)] p-6 border border-[var(--border)]">
                    <h2 className="mb-6 font-bold text-[var(--text-primary)]">Order Summary</h2>
                    <div className="mb-6 space-y-4">
                      {cart.map((item) => (
                        <div
                          key={`${item.menuItemId}-${item.instructions}`}
                          className="flex justify-between text-sm"
                        >
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{item.menuItem.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">x{item.quantity}</p>
                          </div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {(Number(item.menuItem.price) * item.quantity).toLocaleString()} TSH
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t border-[var(--border)] pt-6">
                      <div className="mt-2 flex justify-between border-t border-brand-200 pt-2">
                        <span className="font-bold text-gray-900 dark:text-gray-100">Total</span>
                        <span className="text-lg font-bold text-brand-700 dark:text-brand-300">
                          {cart
                            .reduce((sum, item) => sum + Number(item.menuItem.price) * item.quantity, 0)
                            .toLocaleString()}{' '}
                          TSH
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case FLOW_STEPS.TRACKING:
        return (
          <div className="min-h-screen">
            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
              <div className="mb-8">
                <button
                  onClick={resetOrderFlow}
                  className="mb-4 flex items-center gap-2 text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <ArrowLeft size={20} />
                  <span>Start new order</span>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Order Tracking</h1>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <OrderTracking order={currentOrder} isLoading={isLoading} error={error} />
                </div>

                {currentOrder?.order_type === 'dine_in' && (
                  <div className="h-fit rounded-2xl border border-brand-100 bg-white p-6 shadow-panel dark:border-brand-800 dark:bg-gray-800">
                    <h2 className="mb-4 font-bold text-gray-900 dark:text-gray-100">Need Something?</h2>
                    <DineInActionsPanel
                      orderId={currentOrder.id}
                      onCallWaiter={handleCallWaiter}
                      onRequestBill={handleRequestBill}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {renderContent()}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function getStatusToastMessage(status, orderType) {
  const statusMessages = {
    accepted: 'Your order has been accepted.',
    cooking: 'Your food is now being prepared.',
    ready: orderType === 'dine_in' ? 'Your order is ready to be served.' : 'Your order is ready for dispatch.',
    on_the_way: 'Your food is on the way.',
    delivered: 'Your food has been delivered.',
    served: 'Your order has been served.',
  };

  return statusMessages[status] || 'Order status updated.';
}
