import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useStock() {
  const [opening, setOpening] = useState([]);
  const [usage, setUsage] = useState([]);
  const [closing, setClosing] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllStock = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setOpening([]);
      setUsage([]);
      setClosing([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const [openRes, usageRes, closRes] = await Promise.all([
        supabase
          .from('stock_opening')
          .select('*')
          .eq('recorded_date', today),
        supabase
          .from('stock_usage')
          .select('*')
          .eq('usage_date', today),
        supabase
          .from('stock_closing')
          .select('*')
          .eq('recorded_date', today)
      ]);

      if (openRes.error) throw openRes.error;
      if (usageRes.error) throw usageRes.error;
      if (closRes.error) throw closRes.error;

      setOpening(openRes.data || []);
      setUsage(usageRes.data || []);
      setClosing(closRes.data || []);
      console.log('✅ Stock data loaded');
    } catch (err) {
      console.error('❌ Error loading stock:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStock();
  }, [fetchAllStock]);

  const addOpening = useCallback(async (item) => {
    try {
      const { data, error: err } = await supabase
        .from('stock_opening')
        .insert([{
          item_name: item.item_name,
          quantity: parseInt(item.quantity),
          recorded_date: item.recorded_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (err) throw err;
      setOpening(prev => [data, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const addUsage = useCallback(async (item) => {
    try {
      const { data, error: err } = await supabase
        .from('stock_usage')
        .insert([{
          person_name: item.person_name,
          item_name: item.item_name,
          quantity: parseInt(item.quantity),
          usage_date: item.usage_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (err) throw err;
      setUsage(prev => [data, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const addClosing = useCallback(async (item) => {
    try {
      const { data, error: err } = await supabase
        .from('stock_closing')
        .insert([{
          item_name: item.item_name,
          quantity: parseInt(item.quantity),
          recorded_date: item.recorded_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (err) throw err;
      setClosing(prev => [data, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Calculate sold quantity: opening + produced - closing - used
  const calculateSold = useCallback((itemName, produced = 0) => {
    const openQty = opening.find(o => o.item_name === itemName)?.quantity || 0;
    const closeQty = closing.find(c => c.item_name === itemName)?.quantity || 0;
    const usedQty = usage
      .filter(u => u.item_name === itemName)
      .reduce((sum, u) => sum + u.quantity, 0);

    return Math.max(0, openQty + produced - closeQty - usedQty);
  }, [opening, closing, usage]);

  return {
    opening,
    usage,
    closing,
    isLoading,
    error,
    addOpening,
    addUsage,
    addClosing,
    refetch: fetchAllStock,
    calculateSold
  };
}
