import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useFinance() {
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFinance = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setIncome([]);
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      const [incomeRes, expenseRes] = await Promise.all([
        supabase
          .from('income')
          .select('*')
          .eq('recorded_date', today),
        supabase
          .from('expenses')
          .select('*')
          .eq('recorded_date', today)
      ]);

      if (incomeRes.error) throw incomeRes.error;
      if (expenseRes.error) throw expenseRes.error;

      setIncome(incomeRes.data || []);
      setExpenses(expenseRes.data || []);
      console.log('✅ Finance data loaded');
    } catch (err) {
      console.error('❌ Error loading finance:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  const addIncome = useCallback(async (item) => {
    try {
      const { data, error: err } = await supabase
        .from('income')
        .insert([{
          source: item.source,
          amount: parseFloat(item.amount),
          payment_method: item.payment_method || null,
          recorded_date: item.recorded_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (err) throw err;
      setIncome(prev => [data, ...prev]);
      return { success: true };
    } catch (err) {
      console.error('Error adding income:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const addExpense = useCallback(async (item) => {
    try {
      const { data, error: err } = await supabase
        .from('expenses')
        .insert([{
          description: item.description,
          amount: parseFloat(item.amount),
          category: item.category,
          recorded_date: item.recorded_date || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (err) throw err;
      setExpenses(prev => [data, ...prev]);
      return { success: true };
    } catch (err) {
      console.error('Error adding expense:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteIncome = useCallback(async (id) => {
    try {
      const { error: err } = await supabase
        .from('income')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setIncome(prev => prev.filter(i => i.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    try {
      const { error: err } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (err) throw err;
      setExpenses(prev => prev.filter(e => e.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const getTotalIncome = useCallback(() => {
    return income.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  }, [income]);

  const getTotalExpenses = useCallback(() => {
    return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const getProfit = useCallback(() => {
    return getTotalIncome() - getTotalExpenses();
  }, [getTotalIncome, getTotalExpenses]);

  return {
    income,
    expenses,
    isLoading,
    error,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
    refetch: fetchFinance,
    totalIncome: getTotalIncome(),
    totalExpenses: getTotalExpenses(),
    profit: getProfit()
  };
}
