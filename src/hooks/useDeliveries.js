import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setDeliveries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDeliveries(data || []);
      console.log('✅ Deliveries loaded:', data?.length);
    } catch (err) {
      console.error('❌ Error loading deliveries:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const addDelivery = useCallback(async (delivery) => {
    try {
      const { data, error: err } = await supabase
        .from('deliveries')
        .insert([{
          customer_name: delivery.customer_name,
          location: delivery.location,
          items: delivery.items,
          waiter_name: delivery.waiter_name || null,
          payment_status: delivery.payment_status || 'pending'
        }])
        .select()
        .single();

      if (err) throw err;
      setDeliveries(prev => [data, ...prev]);
      return { success: true };
    } catch (err) {
      console.error('Error adding delivery:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updatePaymentStatus = useCallback(async (id, status) => {
    try {
      const { error: err } = await supabase
        .from('deliveries')
        .update({ payment_status: status })
        .eq('id', id);

      if (err) throw err;
      setDeliveries(prev =>
        prev.map(d => d.id === id ? { ...d, payment_status: status } : d)
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const getTodayDeliveries = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return deliveries.filter(d => d.created_at?.split('T')[0] === today);
  }, [deliveries]);

  const getUnpaidCount = useCallback(() => {
    return getTodayDeliveries().filter(d => d.payment_status === 'pending').length;
  }, [getTodayDeliveries]);

  return {
    deliveries,
    isLoading,
    error,
    addDelivery,
    updatePaymentStatus,
    refetch: fetchDeliveries,
    todayDeliveries: getTodayDeliveries(),
    unpaidCount: getUnpaidCount()
  };
}
