import { supabase } from '../lib/supabaseClient';
import { calculateRevenue, calculateCOGS, calculateGrossProfit, calculateNetProfit, getTopSellingItems, getMostProfitableItems, getLeastProfitableItems } from '../lib/financialService';

/**
 * Get customer source analytics (walk-in, phone order, online, etc.)
 * Shows breakdown of orders by customer source.
 */
async function getCustomerSourceAnalytics(startDate, endDate) {
  if (!supabase) return [];

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('customer_source, payment_status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error('Error fetching customer source analytics:', error);
      return [];
    }

    // Group by customer source
    const sourceStats = {};
    orders.forEach(order => {
      const source = order.customer_source || 'walk_in';
      if (!sourceStats[source]) {
        sourceStats[source] = { total: 0, paid: 0 };
      }
      sourceStats[source].total += 1;
      if (order.payment_status === 'paid') {
        sourceStats[source].paid += 1;
      }
    });

    // Convert to array format
    return Object.entries(sourceStats).map(([source, stats]) => ({
      source,
      total_orders: stats.total,
      paid_orders: stats.paid,
      pending_orders: stats.total - stats.paid,
      percentage: ((stats.total / orders.length) * 100).toFixed(2)
    }));
  } catch (error) {
    console.error('Error in getCustomerSourceAnalytics:', error);
    return [];
  }
}

/**
 * Get order source breakdown with revenue impact
 */
async function getOrderSourceRevenue(startDate, endDate) {
  if (!supabase) return [];

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_source,
        payment_status,
        order_items:order_items(menu_items(price))
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('payment_status', 'paid');

    if (error) {
      console.error('Error fetching order source revenue:', error);
      return [];
    }

    // Aggregate revenue by source
    const sourceRevenue = {};
    orders.forEach(order => {
      const source = order.customer_source || 'walk_in';
      if (!sourceRevenue[source]) {
        sourceRevenue[source] = 0;
      }
      order.order_items?.forEach(item => {
        sourceRevenue[source] += Number(item.menu_items?.price || 0);
      });
    });

    // Convert to array
    return Object.entries(sourceRevenue).map(([source, revenue]) => ({
      source,
      revenue: Number(revenue.toFixed(2))
    }));
  } catch (error) {
    console.error('Error in getOrderSourceRevenue:', error);
    return [];
  }
}

// AnalyticsService provides high‑level getters for reporting UI components.
// It simply forwards to financialService functions, preserving a single source of truth.
const analyticsService = {
  async getRevenue(startDate, endDate) {
    return await calculateRevenue(startDate, endDate);
  },
  async getCOGS(startDate, endDate) {
    return await calculateCOGS(startDate, endDate);
  },
  async getGrossProfit(startDate, endDate) {
    return await calculateGrossProfit(startDate, endDate);
  },
  async getNetProfit(startDate, endDate) {
    return await calculateNetProfit(startDate, endDate);
  },
  async getTopSellingItems(startDate, endDate, limit = 5) {
    return await getTopSellingItems(startDate, endDate, limit);
  },
  async getMostProfitableItems(startDate, endDate, limit = 5) {
    return await getMostProfitableItems(startDate, endDate, limit);
  },
  async getLeastProfitableItems(startDate, endDate, limit = 5) {
    return await getLeastProfitableItems(startDate, endDate, limit);
  },
  async getCustomerSourceAnalytics(startDate, endDate) {
    return await getCustomerSourceAnalytics(startDate, endDate);
  },
  async getOrderSourceRevenue(startDate, endDate) {
    return await getOrderSourceRevenue(startDate, endDate);
  },
};

export default analyticsService;
