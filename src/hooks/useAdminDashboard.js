import { useCallback, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { getLowStockItems } from '../lib/inventoryService';
import dailyOperationsService from '../services/dailyOperationsService';
import {
  buildExpenseDistribution,
  buildReportBreakdown,
  buildHourlyOrderSeries,
  buildStockRows,
  buildTopSoldItems,
  buildTimelineSeries,
  getPeriodRange,
  sumByField,
} from '../features/admin/adminUtils';

const emptyOverview = {
  totalOrders: 0,
  totalIncome: 0,
  totalExpenses: 0,
  profit: 0,
  ordersByType: {
    dine_in: 0,
    delivery: 0,
  },
  topSoldItems: [],
  lowStockItems: [],
  alerts: [],
  unpaidDeliveries: 0,
  paidOrders: 0,
  unpaidOrders: 0,
  chartPeriod: 'weekly',
  range: getPeriodRange('weekly'),
  incomeExpenseSeries: [],
  ordersSeries: [],
  hourlyOrdersSeries: [],
  topItemsChartData: [],
  expenseDistribution: [],
  paidOrders: 0,
  unpaidOrders: 0,
  operational: createEmptyOperationalMetrics(),
};

const emptyFinance = {
  period: 'daily',
  income: [],
  expenses: [],
  totalIncome: 0,
  totalExpenses: 0,
  profit: 0,
};

const emptyStock = {
  period: 'daily',
  rows: [],
  lowStockItems: [],
  mostUsedItems: [],
  wasteItems: [],
};

const emptyDelivery = {
  period: 'weekly',
  deliveries: [],
  paidCount: 0,
  unpaidCount: 0,
};

const emptyReports = {
  period: 'daily',
  totalOrders: 0,
  totalIncome: 0,
  totalExpenses: 0,
  profit: 0,
  ordersByType: {
    dine_in: 0,
    delivery: 0,
  },
  topSoldItems: [],
  breakdown: [],
  range: getPeriodRange('daily'),
  incomeExpenseSeries: [],
  ordersSeries: [],
  hourlyOrdersSeries: [],
  expenseDistribution: [],
  operational: createEmptyOperationalMetrics(),
};

export function useAdminDashboard() {
  const [overview, setOverview] = useState(emptyOverview);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [finance, setFinance] = useState(emptyFinance);
  const [stock, setStock] = useState(emptyStock);
  const [delivery, setDelivery] = useState(emptyDelivery);
  const [reports, setReports] = useState(emptyReports);
  const [loading, setLoading] = useState({
    overview: false,
    menu: false,
    finance: false,
    stock: false,
    delivery: false,
    reports: false,
  });
  const [error, setError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState({});

  const ensureConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Add the required environment variables first.');
    }
  };

  const setLoadingState = (section, value) => {
    setLoading((current) => ({ ...current, [section]: value }));
  };

  const markLoaded = (section) => {
    setLastLoadedAt((current) => ({
      ...current,
      [section]: new Date().toISOString(),
    }));
  };

  const loadOverview = useCallback(async (period = 'weekly') => {
    ensureConfigured();
    setLoadingState('overview', true);
    setError('');

    try {
      const todayRange = getPeriodRange('daily');
      const chartRange = getPeriodRange(period);

      const [
        todayOrdersResponse,
        todayIncomeResponse,
        todayExpensesResponse,
        productionResponse,
        openingResponse,
        usageResponse,
        closingResponse,
        deliveriesResponse,
        chartOrdersResponse,
        chartIncomeResponse,
        chartExpensesResponse,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_type, status, payment_status, created_at, order_items(quantity, menu_items(id, name, price))')
          .gte('created_at', todayRange.startTimestamp)
          .lt('created_at', todayRange.endTimestamp),
        supabase
          .from('income')
          .select('amount')
          .gte('recorded_date', todayRange.startDate)
          .lte('recorded_date', todayRange.endDate),
        supabase
          .from('expenses')
          .select('amount')
          .gte('recorded_date', todayRange.startDate)
          .lte('recorded_date', todayRange.endDate),
        supabase
          .from('production')
          .select('item_name, quantity, created_at')
          .gte('created_at', todayRange.startTimestamp)
          .lt('created_at', todayRange.endTimestamp),
        supabase
          .from('stock_opening')
          .select('item_name, quantity, created_at')
          .gte('recorded_date', todayRange.startDate)
          .lte('recorded_date', todayRange.endDate),
        supabase
          .from('stock_usage')
          .select('item_name, quantity, created_at')
          .gte('usage_date', todayRange.startDate)
          .lte('usage_date', todayRange.endDate),
        supabase
          .from('stock_closing')
          .select('item_name, quantity, created_at')
          .gte('recorded_date', todayRange.startDate)
          .lte('recorded_date', todayRange.endDate),
        supabase
          .from('deliveries')
          .select('id, payment_status')
          .gte('created_at', todayRange.startTimestamp)
          .lt('created_at', todayRange.endTimestamp),
        supabase
          .from('orders')
          .select('id, order_type, status, payment_status, created_at, order_items(quantity, menu_items(id, name, price))')
          .gte('created_at', chartRange.startTimestamp)
          .lt('created_at', chartRange.endTimestamp),
        supabase
          .from('income')
          .select('*')
          .gte('recorded_date', chartRange.startDate)
          .lte('recorded_date', chartRange.endDate),
        supabase
          .from('expenses')
          .select('*')
          .gte('recorded_date', chartRange.startDate)
          .lte('recorded_date', chartRange.endDate),
      ]);

      throwOnError([
        todayOrdersResponse,
        todayIncomeResponse,
        todayExpensesResponse,
        productionResponse,
        openingResponse,
        usageResponse,
        closingResponse,
        deliveriesResponse,
        chartOrdersResponse,
        chartIncomeResponse,
        chartExpensesResponse,
      ]);

      const todayOrders = todayOrdersResponse.data || [];
      const todayIncome = todayIncomeResponse.data || [];
      const todayExpenses = todayExpensesResponse.data || [];
      const deliveries = deliveriesResponse.data || [];
      const chartOrders = chartOrdersResponse.data || [];
      const chartIncome = chartIncomeResponse.data || [];
      const chartExpenses = chartExpensesResponse.data || [];
      const stockInsights = buildStockRows({
        opening: openingResponse.data || [],
        usage: usageResponse.data || [],
        closing: closingResponse.data || [],
        production: productionResponse.data || [],
      });
      const inventoryLowStockItems = await loadInventoryLowStockItems();
      const operationalSnapshot = await safeLoadOperationalSnapshot(todayRange.startDate);
      const chartTimeline = buildTimelineSeries({
        orders: chartOrders,
        income: buildPaidOrderIncomeEntries(chartOrders),
        expenses: chartExpenses,
      });

      const totalIncome = calculatePaidOrderRevenue(todayOrders);
      const totalExpenses = sumByField(todayExpenses, 'amount');
      const alerts = [];
      const unpaidDeliveries = deliveries.filter((item) => item.payment_status !== 'paid').length;

      if (stockInsights.lowStockItems.length > 0 || inventoryLowStockItems.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Low stock items',
          message: `${stockInsights.lowStockItems.length + inventoryLowStockItems.length} stock item(s) are at or below the low-stock threshold.`,
        });
      }

      if (unpaidDeliveries > 0) {
        alerts.push({
          type: 'warning',
          title: 'Unpaid deliveries',
          message: `${unpaidDeliveries} delivery record(s) still need payment follow-up.`,
        });
      }

      if (totalExpenses > 50000 && totalExpenses > totalIncome * 0.7) {
        alerts.push({
          type: 'warning',
          title: 'High expenses',
          message: "Today's expenses are unusually high compared with recorded income.",
        });
      }

      setOverview({
        totalOrders: todayOrders.length,
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        ordersByType: {
          dine_in: todayOrders.filter((order) => order.order_type === 'dine_in').length,
          delivery: todayOrders.filter((order) => order.order_type === 'delivery').length,
        },
        topSoldItems: buildTopSoldItems(todayOrders),
        lowStockItems: [
          ...stockInsights.lowStockItems,
          ...inventoryLowStockItems,
        ],
        alerts,
        unpaidDeliveries,
        paidOrders: todayOrders.filter((order) => order.payment_status === 'paid').length,
        unpaidOrders: todayOrders.filter((order) => order.payment_status !== 'paid').length,
        chartPeriod: period,
        range: chartRange,
        incomeExpenseSeries: chartTimeline.map((entry) => ({
          date: entry.date,
          income: entry.income,
          expenses: entry.expenses,
          profit: entry.income - entry.expenses,
        })),
        ordersSeries: chartTimeline.map((entry) => ({
          date: entry.date,
          orders: entry.orders,
        })),
        hourlyOrdersSeries: buildHourlyOrderSeries(todayOrders),
        topItemsChartData: buildTopSoldItems(chartOrders, 8),
        expenseDistribution: buildExpenseDistribution(chartExpenses),
        operational: operationalSnapshot.metrics,
      });

      markLoaded('overview');
    } catch (actionError) {
      setError(actionError.message || 'Failed to load overview data.');
      throw actionError;
    } finally {
      setLoadingState('overview', false);
    }
  }, []);

  const loadMenuData = useCallback(async () => {
    ensureConfigured();
    setLoadingState('menu', true);
    setError('');

    try {
      const [categoriesResponse, menuItemsResponse] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('menu_items')
          .select('id, name, price, category_id, available, created_at, categories!category_id(id, name, parent_id)')
          .order('name'),
      ]);

      throwOnError([categoriesResponse, menuItemsResponse]);
      setCategories(categoriesResponse.data || []);
      setMenuItems(menuItemsResponse.data || []);
      markLoaded('menu');
    } catch (actionError) {
      setError(actionError.message || 'Failed to load menu data.');
      throw actionError;
    } finally {
      setLoadingState('menu', false);
    }
  }, []);

  const loadFinance = useCallback(async (period = 'daily') => {
    ensureConfigured();
    setLoadingState('finance', true);
    setError('');

    try {
      const range = getPeriodRange(period);

      const [ordersResponse, incomeResponse, expensesResponse] = await Promise.all([
        supabase
          .from('orders')
          .select('id, payment_status, created_at, order_items(quantity, menu_items(id, price))')
          .gte('created_at', range.startTimestamp)
          .lt('created_at', range.endTimestamp),
        supabase
          .from('income')
          .select('*')
          .gte('recorded_date', range.startDate)
          .lte('recorded_date', range.endDate)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .gte('recorded_date', range.startDate)
          .lte('recorded_date', range.endDate)
          .order('created_at', { ascending: false }),
      ]);

      throwOnError([ordersResponse, incomeResponse, expensesResponse]);

      const income = incomeResponse.data || [];
      const expenses = expensesResponse.data || [];
      const totalIncome = calculatePaidOrderRevenue(ordersResponse.data || []);
      const totalExpenses = sumByField(expenses, 'amount');

      setFinance({
        period,
        income,
        expenses,
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
      });

      markLoaded('finance');
    } catch (actionError) {
      setError(actionError.message || 'Failed to load finance data.');
      throw actionError;
    } finally {
      setLoadingState('finance', false);
    }
  }, []);

  const loadStock = useCallback(async (period = 'daily') => {
    ensureConfigured();
    setLoadingState('stock', true);
    setError('');

    try {
      const range = getPeriodRange(period);

      const [openingResponse, usageResponse, closingResponse, productionResponse] = await Promise.all([
        supabase
          .from('stock_opening')
          .select('*')
          .gte('recorded_date', range.startDate)
          .lte('recorded_date', range.endDate)
          .order('recorded_date', { ascending: false }),
        supabase
          .from('stock_usage')
          .select('*')
          .gte('usage_date', range.startDate)
          .lte('usage_date', range.endDate)
          .order('usage_date', { ascending: false }),
        supabase
          .from('stock_closing')
          .select('*')
          .gte('recorded_date', range.startDate)
          .lte('recorded_date', range.endDate)
          .order('recorded_date', { ascending: false }),
        supabase
          .from('production')
          .select('*')
          .gte('created_at', range.startTimestamp)
          .lt('created_at', range.endTimestamp)
          .order('created_at', { ascending: false }),
      ]);

      throwOnError([openingResponse, usageResponse, closingResponse, productionResponse]);

      setStock({
        period,
        ...buildStockRows({
          opening: openingResponse.data || [],
          usage: usageResponse.data || [],
          closing: closingResponse.data || [],
          production: productionResponse.data || [],
        }),
      });

      markLoaded('stock');
    } catch (actionError) {
      setError(actionError.message || 'Failed to load stock data.');
      throw actionError;
    } finally {
      setLoadingState('stock', false);
    }
  }, []);

  const loadDeliveries = useCallback(async (period = 'weekly') => {
    ensureConfigured();
    setLoadingState('delivery', true);
    setError('');

    try {
      const range = getPeriodRange(period);
      const deliveriesResponse = await supabase
        .from('deliveries')
        .select('*')
        .gte('created_at', range.startTimestamp)
        .lt('created_at', range.endTimestamp)
        .order('created_at', { ascending: false });

      throwOnError([deliveriesResponse]);

      const deliveries = deliveriesResponse.data || [];

      setDelivery({
        period,
        deliveries,
        paidCount: deliveries.filter((item) => item.payment_status === 'paid').length,
        unpaidCount: deliveries.filter((item) => item.payment_status !== 'paid').length,
      });

      markLoaded('delivery');
    } catch (actionError) {
      setError(actionError.message || 'Failed to load delivery data.');
      throw actionError;
    } finally {
      setLoadingState('delivery', false);
    }
  }, []);

  const loadReports = useCallback(async (period = 'daily') => {
    ensureConfigured();
    setLoadingState('reports', true);
    setError('');

    try {
      const range = getPeriodRange(period);

      const [ordersResponse, incomeResponse, expensesResponse] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_type, status, payment_status, created_at, order_items(quantity, menu_items(id, name, price))')
          .gte('created_at', range.startTimestamp)
          .lt('created_at', range.endTimestamp)
          .order('created_at', { ascending: false }),
        supabase
          .from('income')
          .select('*')
          .gte('recorded_date', range.startDate)
          .lte('recorded_date', range.endDate),
        supabase
          .from('expenses')
          .select('*')
          .gte('recorded_date', range.startDate)
          .lte('recorded_date', range.endDate),
      ]);

      throwOnError([ordersResponse, incomeResponse, expensesResponse]);

      const orders = ordersResponse.data || [];
      const income = incomeResponse.data || [];
      const expenses = expensesResponse.data || [];
      const totalIncome = calculatePaidOrderRevenue(orders);
      const totalExpenses = sumByField(expenses, 'amount');
      const chartTimeline = buildTimelineSeries({ orders, income: buildPaidOrderIncomeEntries(orders), expenses });
      const operationalMetrics = await safeLoadOperationalRangeMetrics(range.startDate, range.endDate);

      setReports({
        period,
        totalOrders: orders.length,
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        paidOrders: orders.filter((order) => order.payment_status === 'paid').length,
        unpaidOrders: orders.filter((order) => order.payment_status !== 'paid').length,
        ordersByType: {
          dine_in: orders.filter((order) => order.order_type === 'dine_in').length,
          delivery: orders.filter((order) => order.order_type === 'delivery').length,
        },
        topSoldItems: buildTopSoldItems(orders, 8),
        breakdown: buildReportBreakdown({ orders, income, expenses }),
        range,
        incomeExpenseSeries: chartTimeline.map((entry) => ({
          date: entry.date,
          income: entry.income,
          expenses: entry.expenses,
          profit: entry.income - entry.expenses,
        })),
        ordersSeries: chartTimeline.map((entry) => ({
          date: entry.date,
          orders: entry.orders,
        })),
        hourlyOrdersSeries: buildHourlyOrderSeries(orders),
        expenseDistribution: buildExpenseDistribution(expenses),
        operational: operationalMetrics,
      });

      markLoaded('reports');
    } catch (actionError) {
      setError(actionError.message || 'Failed to load reports.');
      throw actionError;
    } finally {
      setLoadingState('reports', false);
    }
  }, []);

  const saveMenuItem = useCallback(async (item) => {
    ensureConfigured();

    const payload = {
      name: item.name,
      price: Number(item.price),
      category_id: Number(item.category_id),
      available: Boolean(item.available),
    };

    if (item.id) {
      const response = await supabase.from('menu_items').update(payload).eq('id', item.id);
      throwOnError([response]);
      return response;
    }

    const response = await supabase.from('menu_items').insert([payload]);
    throwOnError([response]);
    return response;
  }, []);

  const deleteMenuItem = useCallback(async (id) => {
    ensureConfigured();
    const response = await supabase.from('menu_items').delete().eq('id', id);
    throwOnError([response]);
    return response;
  }, []);

  const saveCategory = useCallback(async (category) => {
    ensureConfigured();

    const payload = {
      name: category.name,
      parent_id: category.parent_id ? Number(category.parent_id) : null,
    };

    if (category.id) {
      const response = await supabase.from('categories').update(payload).eq('id', category.id);
      throwOnError([response]);
      return response;
    }

    const response = await supabase.from('categories').insert([payload]);
    throwOnError([response]);
    return response;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    ensureConfigured();
    const response = await supabase.from('categories').delete().eq('id', id);
    throwOnError([response]);
    return response;
  }, []);

  const saveIncome = useCallback(async (record) => {
    ensureConfigured();
    const response = await supabase.from('income').insert([
      {
        source: record.source,
        amount: Number(record.amount),
        payment_method: record.payment_method || null,
        recorded_date: record.recorded_date,
      },
    ]);
    throwOnError([response]);
    return response;
  }, []);

  const saveExpense = useCallback(async (record) => {
    ensureConfigured();
    const response = await supabase.from('expenses').insert([
      {
        description: record.description,
        amount: Number(record.amount),
        category: record.category,
        recorded_date: record.recorded_date,
      },
    ]);
    throwOnError([response]);
    return response;
  }, []);

  const deleteIncome = useCallback(async (id) => {
    ensureConfigured();
    const response = await supabase.from('income').delete().eq('id', id);
    throwOnError([response]);
    return response;
  }, []);

  const deleteExpense = useCallback(async (id) => {
    ensureConfigured();
    const response = await supabase.from('expenses').delete().eq('id', id);
    throwOnError([response]);
    return response;
  }, []);

  const updateDeliveryPaymentStatus = useCallback(async (id, paymentStatus) => {
    ensureConfigured();
    const response = await supabase
      .from('deliveries')
      .update({ payment_status: paymentStatus })
      .eq('id', id);
    throwOnError([response]);
    return response;
  }, []);

  return {
    overview,
    menuItems,
    categories,
    finance,
    stock,
    delivery,
    reports,
    loading,
    error,
    lastLoadedAt,
    loadOverview,
    loadMenuData,
    loadFinance,
    loadStock,
    loadDeliveries,
    loadReports,
    saveMenuItem,
    deleteMenuItem,
    saveCategory,
    deleteCategory,
    saveIncome,
    saveExpense,
    deleteIncome,
    deleteExpense,
    updateDeliveryPaymentStatus,
  };
}

function throwOnError(responses) {
  for (const response of responses) {
    if (response?.error) {
      throw response.error;
    }
  }
}

function calculatePaidOrderRevenue(orders) {
  return (orders || [])
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => {
      const orderTotal = (order.order_items || []).reduce(
        (orderSum, item) => orderSum + Number(item.quantity || 0) * Number(item.menu_items?.price || 0),
        0,
      );
      return sum + orderTotal;
    }, 0);
}

function buildPaidOrderIncomeEntries(orders) {
  return (orders || [])
    .filter((order) => order.payment_status === 'paid')
    .map((order) => ({
      recorded_date: order.created_at?.split('T')[0],
      amount: (order.order_items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.menu_items?.price || 0),
        0,
      ),
    }));
}

async function loadInventoryLowStockItems() {
  const lowStockItems = await getLowStockItems();

  return lowStockItems
    .map((item) => ({
      item_name: item.menu_items?.name || 'Inventory item',
      remaining: `${item.stock_quantity} ${item.unit}`,
    }));
}

function createEmptyOperationalMetrics() {
  return {
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
  };
}

async function safeLoadOperationalSnapshot(businessDate) {
  try {
    return await dailyOperationsService.getOperationalSnapshot(businessDate);
  } catch (error) {
    console.warn('Operational snapshot unavailable:', error.message);
    return { metrics: createEmptyOperationalMetrics() };
  }
}

async function safeLoadOperationalRangeMetrics(startDate, endDate) {
  try {
    return await dailyOperationsService.getOperationalRangeMetrics(startDate, endDate);
  } catch (error) {
    console.warn('Operational range metrics unavailable:', error.message);
    return createEmptyOperationalMetrics();
  }
}
