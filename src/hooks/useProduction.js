import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useProduction() {
  const [production, setProduction] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduction = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setProduction([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('production')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProduction(data || []);
      console.log('✅ Production records loaded:', data?.length);
    } catch (err) {
      console.error('❌ Error loading production:', err);
      setError(err.message);
      setProduction([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProduction();
  }, [fetchProduction]);

  const addProduction = useCallback(async (item) => {
    try {
      const { data, error: insertError } = await supabase
        .from('production')
        .insert([{
          item_name: item.item_name,
          quantity: parseInt(item.quantity),
          cost_per_unit: parseFloat(item.cost_per_unit)
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      setProduction(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      console.error('Error adding production:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteProduction = useCallback(async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('production')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setProduction(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Error deleting production:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const getTodayProduction = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return production.filter(p => {
      const pDate = p.created_at?.split('T')[0];
      return pDate === today;
    });
  }, [production]);

  const getTodayTotal = useCallback(() => {
    return getTodayProduction().reduce((sum, p) => sum + (p.total_value || 0), 0);
  }, [getTodayProduction]);

  return {
    production,
    isLoading,
    error,
    addProduction,
    deleteProduction,
    refetch: fetchProduction,
    todayProduction: getTodayProduction(),
    todayTotal: getTodayTotal()
  };
}
