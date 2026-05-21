import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import financialService from '../lib/financialService';

function isMissingTableError(error) {
  return error?.code === 'PGRST205' || error?.message?.includes('Could not find the table');
}

async function attachMenuItems(rows) {
  const menuItemIds = [...new Set((rows || []).map((row) => row.menu_item_id).filter(Boolean))];
  if (!supabase || menuItemIds.length === 0) {
    return rows || [];
  }

  const { data: menuItems, error: menuItemsError } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .in('id', menuItemIds);

  if (menuItemsError) throw menuItemsError;

  const menuItemsById = (menuItems || []).reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});

  return (rows || []).map((row) => ({
    ...row,
    menu_items: menuItemsById[row.menu_item_id] || null,
  }));
}

export function useFinancialData() {
  const [itemCosts, setItemCosts] = useState([]);
  const [financialExpenses, setFinancialExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadItemCosts = useCallback(async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setItemCosts([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('item_costs')
        .select('id, menu_item_id, cost_per_unit, notes')
        .order('menu_item_id', { ascending: true });

      if (fetchError) throw fetchError;
      setItemCosts(await attachMenuItems(data || []));
      setError(null);
    } catch (err) {
      if (isMissingTableError(err)) {
        setItemCosts([]);
        setError(null);
        return;
      }

      console.error('Error loading item costs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExpenses = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);

      if (!supabase) {
        setFinancialExpenses([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('financial_expenses')
        .select('*')
        .gte('expense_date', financialService.formatDateOnly(startDate))
        .lte('expense_date', financialService.formatDateOnly(endDate))
        .order('expense_date', { ascending: false });

      if (fetchError) throw fetchError;
      setFinancialExpenses(data || []);
      setError(null);
    } catch (err) {
      if (isMissingTableError(err)) {
        setFinancialExpenses([]);
        setError(null);
        return;
      }

      console.error('Error loading expenses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveItemCost = useCallback(async (menuItemId, costPerUnit, notes) => {
    try {
      setLoading(true);

      if (!supabase) {
        return false;
      }

      const { data: existing, error: existingError } = await supabase
        .from('item_costs')
        .select('id')
        .eq('menu_item_id', menuItemId)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload = {
        cost_per_unit: Number(costPerUnit),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      const result = existing
        ? await supabase.from('item_costs').update(payload).eq('menu_item_id', menuItemId)
        : await supabase.from('item_costs').insert({ ...payload, menu_item_id: menuItemId });

      if (result.error) throw result.error;

      await loadItemCosts();
      setError(null);
      return true;
    } catch (err) {
      console.error('Error saving item cost:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItemCosts]);

  const saveExpense = useCallback(async (expenseData) => {
    try {
      setLoading(true);

      if (!supabase) {
        return false;
      }

      const { error: insertError } = await supabase
        .from('financial_expenses')
        .insert({
          title: expenseData.title,
          amount: Number(expenseData.amount),
          type: expenseData.type,
          category: expenseData.category || null,
          description: expenseData.description || null,
          expense_date: expenseData.expense_date,
        });

      if (insertError) throw insertError;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      await loadExpenses(startOfMonth, today);

      setError(null);
      return true;
    } catch (err) {
      console.error('Error saving financial expense:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  const deleteExpense = useCallback(async (expenseId) => {
    try {
      setLoading(true);

      if (!supabase) {
        return false;
      }

      const { error: deleteError } = await supabase
        .from('financial_expenses')
        .delete()
        .eq('id', expenseId);

      if (deleteError) throw deleteError;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      await loadExpenses(startOfMonth, today);

      setError(null);
      return true;
    } catch (err) {
      console.error('Error deleting financial expense:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  useEffect(() => {
    loadItemCosts();

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    loadExpenses(startOfMonth, today);
  }, [loadItemCosts, loadExpenses]);

  return {
    itemCosts,
    financialExpenses,
    loading,
    error,
    loadItemCosts,
    loadExpenses,
    saveItemCost,
    saveExpense,
    deleteExpense,
  };
}

export default useFinancialData;
