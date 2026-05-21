import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export function useMenuOnly() {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Menu items are database-only; no demo fallback
    if (!isSupabaseConfigured || !supabase) {
      console.warn('⚠️ Supabase not configured - no menu items available');
      setMenuItems([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadMenuItems() {
      setIsLoading(true);
      setError('');
      
      try {
        const { data, error: err } = await supabase
          .from('menu_items')
          .select('*, categories!category_id(id, name, parent_id)')
          .eq('available', true)
          .order('name');

        if (isMounted) {
          if (err) {
            console.error('❌ Error loading menu from database:', err);
            setError(err.message);
            setMenuItems([]);
          } else {
            console.log('✅ Menu items loaded from database:', data?.length || 0);
            setMenuItems(data ?? []);
          }
          setIsLoading(false);
        }
      } catch (e) {
        console.error('❌ Exception loading menu:', e);
        if (isMounted) {
          setError(e.message);
          setMenuItems([]);
          setIsLoading(false);
        }
      }
    }

    loadMenuItems();

    // Lightweight subscription: only menu changes
    const channel = supabase
      .channel('menu-updates-customer')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setMenuItems((items) => items.filter((i) => i.id !== payload.old.id));
          } else if (payload.new.available) {
            setMenuItems((items) =>
              items.some((i) => i.id === payload.new.id)
                ? items.map((i) => (i.id === payload.new.id ? payload.new : i))
                : [...items, payload.new]
            );
          } else {
            // Item marked unavailable
            setMenuItems((items) => items.filter((i) => i.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { menuItems, isLoading, error };
}
