import { useCallback, useEffect, useState } from 'react';
import inventoryService from '../lib/inventoryService';
import { supabase } from '../lib/supabaseClient';

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setInventory(await inventoryService.getInventory());
    } catch (err) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveInventoryItem = useCallback(async (item) => {
    try {
      setLoading(true);
      setError('');
      await inventoryService.saveInventoryItem(item);
      await loadInventory();
      return { ok: true };
    } catch (err) {
      setError(err.message || 'Failed to save inventory.');
      return { error: err.message || 'Failed to save inventory.' };
    } finally {
      setLoading(false);
    }
  }, [loadInventory]);

  useEffect(() => {
    loadInventory();

    if (!supabase) return undefined;

    const channel = supabase
      .channel('inventory-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, loadInventory)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInventory]);

  return {
    inventory,
    lowStockItems: inventory.filter(inventoryService.isLowStock),
    loading,
    error,
    loadInventory,
    saveInventoryItem,
  };
}

export default useInventory;
