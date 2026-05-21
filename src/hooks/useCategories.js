import { useState, useEffect, useCallback, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [menuItemsCache, setMenuItemsCache] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});
  const subscribedRef = useRef(false);

  // Fetch all categories on mount with real-time subscription
  useEffect(() => {
    fetchCategories();
    subscribeToMenuChanges();

    return () => {
      // Cleanup subscription
      if (subscribedRef.current) {
        supabase?.removeAllChannels();
      }
    };
  }, []);

  const fetchCategories = async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all categories in one request
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*');

      if (fetchError) throw fetchError;

      setCategories(data || []);
      const main = (data || []).filter(cat => cat.parent_id === null);
      setMainCategories(main);
      console.log(`✅ Categories loaded: ${data?.length || 0} total, ${main.length} main`);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to menu items changes for real-time updates
  const subscribeToMenuChanges = () => {
    if (!supabase || subscribedRef.current) return;

    try {
      const channel = supabase
        .channel('menu-items-realtime')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items' },
          (payload) => {
            console.log('🔄 Menu items changed:', payload.eventType);
            // Invalidate cache on any menu change
            cacheRef.current = {};
            setMenuItemsCache({});
          }
        )
        .subscribe();

      subscribedRef.current = true;
      console.log('✅ Subscribed to menu items changes');
    } catch (err) {
      console.error('Error subscribing to menu changes:', err);
    }
  };

  const getSubCategories = useCallback((mainCategoryId) => {
    return categories.filter(cat => cat.parent_id === mainCategoryId);
  }, [categories]);

  // Optimized: Fetch and cache menu items
  const fetchMenuItemsByCategory = useCallback(async (categoryId) => {
    if (!isSupabaseConfigured || !supabase || !categoryId) return [];

    // Return cached data if available
    if (cacheRef.current[categoryId]) {
      return cacheRef.current[categoryId];
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('id, name, price, category_id, available')
        .eq('category_id', categoryId)
        .order('name');

      if (fetchError) throw fetchError;

      const items = data || [];
      // Cache the result
      cacheRef.current[categoryId] = items;
      setMenuItemsCache(prev => ({ ...prev, [categoryId]: items }));
      
      console.log(`✅ Menu items loaded for category ${categoryId}: ${items.length} items`);
      return items;
    } catch (err) {
      console.error('❌ Error fetching menu items:', err.message);
      return [];
    }
  }, []);

  return {
    categories,
    mainCategories,
    isLoading,
    error,
    getSubCategories,
    fetchMenuItemsByCategory,
    refreshCategories: fetchCategories,
  };
}
