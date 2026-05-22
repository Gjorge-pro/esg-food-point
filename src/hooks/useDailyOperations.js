import { useCallback, useEffect, useState } from 'react';
import dailyOperationsService from '../services/dailyOperationsService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { formatDateOnly } from '../lib/financialService';

const emptySnapshot = {
  session: null,
  opening: [],
  closing: [],
  production: [],
  orders: [],
  expenses: [],
  debts: [],
  waste: [],
  leftovers: [],
  metrics: {
    openingItems: 0,
    closingItems: 0,
    productionItems: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    servedOrders: 0,
    revenue: 0,
    expenses: 0,
    debt: 0,
    operatingProfit: 0,
    wasteQuantity: 0,
    leftoverQuantity: 0,
    serviceCompletionRate: 0,
  },
};

export function useDailyOperations(auth) {
  const [businessDate, setBusinessDate] = useState(formatDateOnly(new Date()));
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSnapshot = useCallback(async (nextDate = businessDate) => {
    if (!isSupabaseConfigured) {
      setSnapshot(emptySnapshot);
      return emptySnapshot;
    }

    setLoading(true);
    setError('');

    try {
      const data = await dailyOperationsService.getOperationalSnapshot(nextDate);
      setSnapshot(data);
      return data;
    } catch (actionError) {
      setError(actionError.message || 'Failed to load daily operations.');
      throw actionError;
    } finally {
      setLoading(false);
    }
  }, [businessDate]);

  useEffect(() => {
    loadSnapshot().catch(() => {});
  }, [loadSnapshot]);

  const withSave = useCallback(async (operation) => {
    setSaving(true);
    setError('');

    try {
      const result = await operation();
      await loadSnapshot();
      return { success: true, data: result };
    } catch (actionError) {
      const message = actionError.message || 'Operation failed.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  }, [loadSnapshot]);

  const ensureSession = useCallback(async () => {
    return snapshot.session || dailyOperationsService.getOrCreateDailySession(businessDate, auth?.user?.id || null);
  }, [auth?.user?.id, businessDate, snapshot.session]);

  const openDay = useCallback((payload) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.openSession(session.id, {
      userId: auth?.user?.id || null,
      notes: payload.notes,
      cashOpening: payload.cashOpening,
    });
  }), [auth?.user?.id, ensureSession, withSave]);

  const startClosing = useCallback(() => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.startClosing(session.id);
  }), [ensureSession, withSave]);

  const closeDay = useCallback((payload) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.closeSession(session.id, {
      userId: auth?.user?.id || null,
      notes: payload.notes,
      cashClosing: payload.cashClosing,
    });
  }), [auth?.user?.id, ensureSession, withSave]);

  const recordOpeningStock = useCallback((item) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.recordOpeningStock(session.id, {
      ...item,
      recorded_date: businessDate,
    });
  }), [businessDate, ensureSession, withSave]);

  const recordClosingStock = useCallback((item) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.recordClosingStock(session.id, {
      ...item,
      recorded_date: businessDate,
    });
  }), [businessDate, ensureSession, withSave]);

  const recordWaste = useCallback((item) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.recordWaste(session.id, item);
  }), [ensureSession, withSave]);

  const recordLeftover = useCallback((item) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.recordLeftover(session.id, item);
  }), [ensureSession, withSave]);

  const createSupplierDebt = useCallback((debt) => withSave(async () => {
    const session = await ensureSession();
    return dailyOperationsService.createSupplierDebt(session.id, {
      ...debt,
      transaction_date: businessDate,
    });
  }), [businessDate, ensureSession, withSave]);

  return {
    businessDate,
    setBusinessDate,
    snapshot,
    loading,
    saving,
    error,
    loadSnapshot,
    openDay,
    startClosing,
    closeDay,
    recordOpeningStock,
    recordClosingStock,
    recordWaste,
    recordLeftover,
    createSupplierDebt,
  };
}

export default useDailyOperations;
