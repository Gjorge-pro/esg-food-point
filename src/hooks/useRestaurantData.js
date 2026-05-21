import { useEffect, useMemo, useState } from 'react';
import { demoOrders } from '../lib/demoData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export function useRestaurantData() {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState('');

  useEffect(() => {
    if (!supabase) {
      // Menu items are database-only; return empty if Supabase not available
      setMenuItems([]);
      setOrders(demoOrders);
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError('');

      const [menuResponse, orderResponse] = await Promise.all([
        supabase.from('menu_items').select('*').order('name'),
        supabase
          .from('orders')
          .select('*, order_items(*, menu_items(id, name, price))')
          .order('created_at', { ascending: false }),
      ]);

      if (!isMounted) return;

      if (menuResponse.error) {
        setError(menuResponse.error.message);
      } else {
        setMenuItems(menuResponse.data ?? []);
      }

      if (orderResponse.error) {
        setError(orderResponse.error.message);
      } else {
        setOrders(withTotals(orderResponse.data ?? []));
      }

      setIsLoading(false);
    }

    loadData();

    const ordersChannel = supabase
      .channel('orders-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { data, error: orderReloadError } = await supabase
          .from('orders')
          .select('*, order_items(*, menu_items(id, name, price))')
          .order('created_at', { ascending: false });

        if (orderReloadError) {
          setError(orderReloadError.message);
          return;
        }

        setOrders(withTotals(data ?? []));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, async () => {
        const { data, error: orderReloadError } = await supabase
          .from('orders')
          .select('*, order_items(*, menu_items(id, name, price))')
          .order('created_at', { ascending: false });

        if (orderReloadError) {
          setError(orderReloadError.message);
          return;
        }

        setOrders(withTotals(data ?? []));
      })
      .subscribe();

    const menuChannel = supabase
      .channel('menu-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
        const { data, error: menuReloadError } = await supabase
          .from('menu_items')
          .select('*')
          .order('name');

        if (menuReloadError) {
          setError(menuReloadError.message);
          return;
        }

        setMenuItems(data ?? []);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(menuChannel);
    };
  }, []);

  const actions = useMemo(
    () => ({
      async createOrder(payload) {
        if (!supabase) {
          return {
            error: 'Supabase is not configured. Add env vars from .env.example to create real orders.',
          };
        }

        try {
          setPendingAction('create-order');
          setError('');

          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              order_type: payload.order_type,
              customer_name: payload.customer_name,
              phone: payload.phone,
              address: payload.address,
              table_number: payload.table_number,
              status: 'pending',
            })
            .select()
            .single();

          if (orderError) throw orderError;

          const orderItemsPayload = payload.items.map((item) => ({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
          }));

          const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
          if (itemsError) throw itemsError;

          return { data: order };
        } catch (actionError) {
          return { error: actionError.message || 'Failed to create order.' };
        } finally {
          setPendingAction('');
        }
      },

      async updateOrderStatus(orderId, status) {
        if (!supabase) {
          return { error: 'Supabase is not configured.' };
        }

        try {
          setPendingAction('update-status');
          setError('');
          const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);
          if (updateError) throw updateError;
          return { ok: true };
        } catch (actionError) {
          return { error: actionError.message || 'Failed to update order status.' };
        } finally {
          setPendingAction('');
        }
      },

      async saveMenuItem(item) {
        if (!supabase) {
          return { error: 'Supabase is not configured.' };
        }

        try {
          setPendingAction('save-menu-item');
          setError('');

          if (item.id) {
            const { error: updateError } = await supabase
              .from('menu_items')
              .update({
                name: item.name,
                price: item.price,
                category: item.category,
                available: item.available,
              })
              .eq('id', item.id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase.from('menu_items').insert(item);
            if (insertError) throw insertError;
          }

          return { ok: true };
        } catch (actionError) {
          return { error: actionError.message || 'Failed to save menu item.' };
        } finally {
          setPendingAction('');
        }
      },

      async deleteMenuItem(id) {
        if (!supabase) {
          return { error: 'Supabase is not configured.' };
        }

        try {
          setPendingAction('delete-menu-item');
          setError('');
          const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', id);
          if (deleteError) throw deleteError;
          return { ok: true };
        } catch (actionError) {
          return { error: actionError.message || 'Failed to delete menu item.' };
        } finally {
          setPendingAction('');
        }
      },
    }),
    [],
  );

    return {
    menuItems,
    orders,
    isLoading,
    isConfigured: isSupabaseConfigured,
    error,
    pendingAction,
    ...actions,
  };
}

function withTotals(items) {
  return items.map((order) => ({
    ...order,
    total_amount: (order.order_items ?? []).reduce(
      (sum, item) => sum + (item.menu_items?.price || 0) * item.quantity,
      0,
    ),
  }));
}
