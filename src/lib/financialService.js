import { supabase } from './supabaseClient';

function isRevenueOrder(order) {
  return order.payment_status === 'paid';
}

function getOrderRevenue(order) {
  return (order.order_items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.menu_items?.price || 0),
    0,
  );
}

function getItemCost(item) {
  return Number(item.cost_per_unit || 0);
}

function isMissingTableError(error) {
  return error?.code === 'PGRST205' || error?.message?.includes('Could not find the table');
}

async function fetchItemCosts() {
  if (!supabase) {
    return {};
  }

  const { data, error } = await supabase
    .from('item_costs')
    .select('menu_item_id, cost_per_unit');

  if (error) {
    if (isMissingTableError(error)) {
      return {};
    }
    throw error;
  }

  return (data || []).reduce((costsByMenuItemId, entry) => {
    costsByMenuItemId[entry.menu_item_id] = Number(entry.cost_per_unit || 0);
    return costsByMenuItemId;
  }, {});
}

async function fetchProductionCogsByOrder(startDate, endDate) {
  if (!supabase) {
    return {};
  }

  const { data: usageRows, error } = await supabase
    .from('production_usage')
    .select('order_id, batch_id, menu_item_id, quantity, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    if (isMissingTableError(error)) return {};
    throw error;
  }

  const batchIds = [...new Set((usageRows || []).map((row) => row.batch_id).filter(Boolean))];
  if (batchIds.length === 0) return {};

  const { data: batches, error: batchError } = await supabase
    .from('production_batches')
    .select('id, cost_per_unit')
    .in('id', batchIds);

  if (batchError) throw batchError;

  const costByBatchId = (batches || []).reduce((map, batch) => {
    map[batch.id] = Number(batch.cost_per_unit || 0);
    return map;
  }, {});

  return (usageRows || []).reduce((map, row) => {
    const orderId = row.order_id;
    const menuItemId = row.menu_item_id;
    if (!map[orderId]) map[orderId] = {};
    if (!map[orderId][menuItemId]) {
      map[orderId][menuItemId] = {
        totalCost: 0,
        totalQuantity: 0,
      };
    }

    const quantity = Number(row.quantity || 0);
    map[orderId][menuItemId].totalQuantity += quantity;
    map[orderId][menuItemId].totalCost += quantity * Number(costByBatchId[row.batch_id] || 0);
    return map;
  }, {});
}

async function fetchFinancialOrders(startDate, endDate) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      payment_status,
      created_at,
      order_items(
        quantity,
        menu_items(id, name, price)
      )
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;

  const [costsByMenuItemId, productionCogsByOrder] = await Promise.all([
    fetchItemCosts(),
    fetchProductionCogsByOrder(startDate, endDate),
  ]);

  return (data || []).filter(isRevenueOrder).map((order) => ({
    ...order,
    order_items: (order.order_items || []).map((item) => ({
      ...item,
      cost_per_unit:
        productionCogsByOrder[order.id]?.[item.menu_items?.id]?.totalQuantity > 0
          ? productionCogsByOrder[order.id][item.menu_items?.id].totalCost /
            productionCogsByOrder[order.id][item.menu_items?.id].totalQuantity
          : costsByMenuItemId[item.menu_items?.id] || 0,
      cost_source:
        productionCogsByOrder[order.id]?.[item.menu_items?.id]?.totalQuantity > 0
          ? 'production_batch'
          : 'manual_item_cost',
    })),
  }));
}

export function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function calculateRevenue(startDate, endDate) {
  try {
    const orders = await fetchFinancialOrders(startDate, endDate);
    return orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
  } catch (error) {
    console.error('Error calculating revenue:', error);
    return 0;
  }
}

export async function calculateCOGS(startDate, endDate) {
  try {
    const orders = await fetchFinancialOrders(startDate, endDate);
    return orders.reduce((orderSum, order) => {
      const orderCogs = (order.order_items || []).reduce((itemSum, item) => {
        return itemSum + Number(item.quantity || 0) * getItemCost(item);
      }, 0);
      return orderSum + orderCogs;
    }, 0);
  } catch (error) {
    console.error('Error calculating COGS:', error);
    return 0;
  }
}

export async function calculateGrossProfit(startDate, endDate) {
  try {
    const revenue = await calculateRevenue(startDate, endDate);
    const cogs = await calculateCOGS(startDate, endDate);
    const grossProfit = revenue - cogs;

    return {
      revenue: Number(revenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossMarginPercent: revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(2)) : 0,
    };
  } catch (error) {
    console.error('Error calculating gross profit:', error);
    return { revenue: 0, cogs: 0, grossProfit: 0, grossMarginPercent: 0 };
  }
}

export async function calculateExpenses(startDate, endDate) {
  try {
    if (!supabase) {
      return { total: 0, byType: { fixed: 0, variable: 0 }, count: 0 };
    }

    const { data, error } = await supabase
      .from('financial_expenses')
      .select('id, title, amount, type, category')
      .gte('expense_date', formatDateOnly(startDate))
      .lte('expense_date', formatDateOnly(endDate));

    if (error) throw error;

    const expenses = data || [];
    const byType = {
      fixed: expenses
        .filter((entry) => entry.type === 'fixed')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      variable: expenses
        .filter((entry) => entry.type === 'variable')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    };

    const total = byType.fixed + byType.variable;

    return {
      total: Number(total.toFixed(2)),
      byType: {
        fixed: Number(byType.fixed.toFixed(2)),
        variable: Number(byType.variable.toFixed(2)),
      },
      count: expenses.length,
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { total: 0, byType: { fixed: 0, variable: 0 }, count: 0 };
    }

    console.error('Error calculating expenses:', error);
    return { total: 0, byType: { fixed: 0, variable: 0 }, count: 0 };
  }
}

export async function calculateNetProfit(startDate, endDate) {
  try {
    const grossProfitData = await calculateGrossProfit(startDate, endDate);
    const expensesData = await calculateExpenses(startDate, endDate);
    const netProfit = grossProfitData.grossProfit - expensesData.total;

    return {
      revenue: grossProfitData.revenue,
      cogs: grossProfitData.cogs,
      grossProfit: grossProfitData.grossProfit,
      grossMarginPercent: grossProfitData.grossMarginPercent,
      expenses: expensesData.total,
      expensesByType: expensesData.byType,
      netProfit: Number(netProfit.toFixed(2)),
      netMarginPercent: grossProfitData.revenue > 0
        ? Number(((netProfit / grossProfitData.revenue) * 100).toFixed(2))
        : 0,
    };
  } catch (error) {
    console.error('Error calculating net profit:', error);
    return {
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      grossMarginPercent: 0,
      expenses: 0,
      expensesByType: { fixed: 0, variable: 0 },
      netProfit: 0,
      netMarginPercent: 0,
    };
  }
}

export async function calculateProfitMargin(startDate, endDate) {
  const summary = await calculateNetProfit(startDate, endDate);
  return summary.netMarginPercent;
}

export async function getItemProfitability(startDate, endDate) {
  try {
    const orders = await fetchFinancialOrders(startDate, endDate);
    const aggregated = {};

    orders.flatMap((order) => order.order_items || []).forEach((item) => {
      const menuId = item.menu_items?.id;
      const menuName = item.menu_items?.name || 'Unknown item';
      const sellPrice = Number(item.menu_items?.price || 0);
      const costPrice = getItemCost(item);
      const quantity = Number(item.quantity || 0);

      if (!aggregated[menuId]) {
        aggregated[menuId] = {
          id: menuId,
          name: menuName,
          sellPrice,
          costPrice,
          quantity: 0,
          revenue: 0,
          cogs: 0,
        };
      }

      aggregated[menuId].quantity += quantity;
      aggregated[menuId].revenue += sellPrice * quantity;
      aggregated[menuId].cogs += costPrice * quantity;
    });

    return Object.values(aggregated)
      .map((item) => {
        const profit = item.revenue - item.cogs;
        return {
          ...item,
          profit: Number(profit.toFixed(2)),
          profitMargin: item.revenue > 0 ? Number(((profit / item.revenue) * 100).toFixed(2)) : 0,
        };
      })
      .sort((left, right) => right.profit - left.profit);
  } catch (error) {
    console.error('Error getting item profitability:', error);
    return [];
  }
}

export async function getTopSellingItems(startDate, endDate, limit = 5) {
  const items = await getItemProfitability(startDate, endDate);
  return [...items].sort((left, right) => right.quantity - left.quantity).slice(0, limit);
}

export async function getMostProfitableItems(startDate, endDate, limit = 5) {
  const items = await getItemProfitability(startDate, endDate);
  return [...items].sort((left, right) => right.profit - left.profit).slice(0, limit);
}

export async function getLeastProfitableItems(startDate, endDate, limit = 5) {
  const items = await getItemProfitability(startDate, endDate);
  return [...items].sort((left, right) => left.profit - right.profit).slice(0, limit);
}

export async function getFinancialSummary(period = 'daily') {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  if (period === 'weekly') {
    startDate.setDate(startDate.getDate() - 6);
  } else if (period === 'monthly') {
    startDate.setDate(1);
  }
  startDate.setHours(0, 0, 0, 0);

  try {
    const [financial, topSellingItems, mostProfitableItems, leastProfitableItems] = await Promise.all([
      calculateNetProfit(startDate, endDate),
      getTopSellingItems(startDate, endDate, 5),
      getMostProfitableItems(startDate, endDate, 5),
      getLeastProfitableItems(startDate, endDate, 5),
    ]);

    return {
      period,
      dateRange: { startDate: formatDateOnly(startDate), endDate: formatDateOnly(endDate) },
      financial,
      topSellingItems,
      mostProfitableItems,
      leastProfitableItems,
    };
  } catch (error) {
    console.error('Error getting financial summary:', error);
    return {
      period,
      dateRange: { startDate: '', endDate: '' },
      financial: {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        expenses: 0,
        expensesByType: { fixed: 0, variable: 0 },
        netProfit: 0,
        netMarginPercent: 0,
      },
      topSellingItems: [],
      mostProfitableItems: [],
      leastProfitableItems: [],
    };
  }
}

export default {
  calculateRevenue,
  calculateCOGS,
  calculateGrossProfit,
  calculateExpenses,
  calculateNetProfit,
  calculateProfitMargin,
  getItemProfitability,
  getTopSellingItems,
  getMostProfitableItems,
  getLeastProfitableItems,
  getFinancialSummary,
  formatDateOnly,
};
