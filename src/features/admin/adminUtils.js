export function getPeriodRange(period) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  if (period === 'weekly') {
    start.setDate(start.getDate() - 6);
  } else if (period === 'monthly') {
    start.setDate(1);
  }

  end.setDate(end.getDate() + 1);

  return {
    period,
    startDate: formatDateOnly(start),
    endDate: formatDateOnly(new Date(end.getTime() - 1)),
    startTimestamp: start.toISOString(),
    endTimestamp: end.toISOString(),
  };
}

export function buildTopSoldItems(orders, limit = 5) {
  const aggregated = {};

  for (const order of orders) {
    for (const item of order.order_items || []) {
      const itemName = item.menu_items?.name || 'Unknown item';

      if (!aggregated[itemName]) {
        aggregated[itemName] = {
          name: itemName,
          quantity: 0,
          revenue: 0,
        };
      }

      aggregated[itemName].quantity += Number(item.quantity || 0);
      aggregated[itemName].revenue += Number(item.menu_items?.price || 0) * Number(item.quantity || 0);
    }
  }

  return Object.values(aggregated)
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, limit);
}

export function buildTimelineSeries({ orders, income, expenses }) {
  const days = {};

  for (const order of orders) {
    const key = formatDateOnly(new Date(order.created_at));
    days[key] ||= createEmptyDay(key);
    days[key].orders += 1;
  }

  for (const entry of income) {
    const key = entry.recorded_date;
    days[key] ||= createEmptyDay(key);
    days[key].income += Number(entry.amount || 0);
  }

  for (const entry of expenses) {
    const key = entry.recorded_date;
    days[key] ||= createEmptyDay(key);
    days[key].expenses += Number(entry.amount || 0);
  }

  return Object.values(days).sort((left, right) => new Date(left.date) - new Date(right.date));
}

export function buildHourlyOrderSeries(orders) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    orders: 0,
  }));

  for (const order of orders) {
    const hour = new Date(order.created_at).getHours();
    hours[hour].orders += 1;
  }

  return hours;
}

export function buildExpenseDistribution(expenses) {
  const grouped = {};

  for (const entry of expenses) {
    const key = entry.category || 'Uncategorized';
    grouped[key] ||= {
      category: key,
      amount: 0,
    };
    grouped[key].amount += Number(entry.amount || 0);
  }

  return Object.values(grouped).sort((left, right) => right.amount - left.amount);
}

export function buildStockRows({ opening, usage, closing, production }) {
  const itemNames = new Set([
    ...opening.map((item) => item.item_name),
    ...usage.map((item) => item.item_name),
    ...closing.map((item) => item.item_name),
    ...production.map((item) => item.item_name),
  ]);

  const rows = [...itemNames]
    .map((itemName) => {
      const openingTotal = sumByField(opening.filter((item) => item.item_name === itemName), 'quantity');
      const producedTotal = sumByField(production.filter((item) => item.item_name === itemName), 'quantity');
      const usedTotal = sumByField(usage.filter((item) => item.item_name === itemName), 'quantity');
      const closingRecords = closing
        .filter((item) => item.item_name === itemName)
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
      const latestClosing = closingRecords[0]?.quantity ?? null;
      const sold = latestClosing === null
        ? null
        : Math.max(0, openingTotal + producedTotal - latestClosing - usedTotal);
      const remaining = latestClosing;
      const potentialWaste = latestClosing === null
        ? null
        : Math.max(0, producedTotal - (sold || 0) - latestClosing);

      return {
        item_name: itemName,
        opening: openingTotal,
        produced: producedTotal,
        used: usedTotal,
        closing: latestClosing,
        sold,
        remaining,
        potentialWaste,
      };
    })
    .sort((left, right) => left.item_name.localeCompare(right.item_name));

  return {
    rows,
    lowStockItems: rows.filter((item) => item.remaining !== null && item.remaining <= 5),
    mostUsedItems: [...rows].sort((left, right) => right.used - left.used).slice(0, 5),
    wasteItems: rows
      .filter((item) => item.potentialWaste !== null && item.potentialWaste > 0)
      .sort((left, right) => right.potentialWaste - left.potentialWaste)
      .slice(0, 5),
  };
}

export function buildReportBreakdown({ orders, income, expenses }) {
  return buildTimelineSeries({ orders, income, expenses })
    .map((day) => ({
      ...day,
      profit: day.income - day.expenses,
    }))
    .sort((left, right) => new Date(right.date) - new Date(left.date));
}

export function sumByField(items, field) {
  return items.reduce((sum, item) => sum + Number(item[field] || 0), 0);
}

export function formatDateOnly(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().split('T')[0];
}

function createEmptyDay(date) {
  return {
    date,
    orders: 0,
    income: 0,
    expenses: 0,
  };
}
