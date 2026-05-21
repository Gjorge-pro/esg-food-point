# 🏗️ Financial Intelligence System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   ESG FOODPOINT SYSTEM                          │
│                   (Restaurant Management)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐         ┌─────────┐         ┌──────────────┐
   │ Customer│         │  Admin  │         │ Service Desk │
   │  View   │         │  View   │         │    View      │
   └─────────┘         └────┬────┘         └──────────────┘
     (No Changes)           │
                     ┌──────┴──────┬─────────────┐
                     ▼             ▼             ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │ Overview │  │  Finance │  │ Reports  │
              │   Tab    │  │   Tab ✨ │  │   Tab ✨ │
              └──────────┘  └────┬─────┘  └────┬─────┘
                                │             │
                    ┌───────────┴─────────────┴─────────┐
                    ▼                                   ▼
          ┌──────────────────┐          ┌──────────────────────┐
          │ NEW: Cost Mgmt   │          │ NEW: Profitability   │
          │ Profit Analysis  │          │ Analysis & Charts    │
          │ Item Profit Data │          └──────────────────────┘
          └────────┬─────────┘
                   │
                   ▼
        ┌─────────────────────────────┐
        │ Financial Service Layer ✨   │
        ├─────────────────────────────┤
        │ • calculateRevenue()         │
        │ • calculateCOGS()            │
        │ • calculateGrossProfit()     │
        │ • calculateNetProfit()       │
        │ • getItemProfitability()     │
        │ • getFinancialSummary()      │
        └─────────┬───────────────────┘
                  │
        ┌─────────┴──────────────┐
        ▼                        ▼
    ┌──────────┐         ┌───────────────┐
    │ useFinance       │ Supabase      │
    │ Data Hook ✨      │ Database ✨    │
    └──────────┘       ├───────────────┤
                       │ item_costs    │
                       │ financial_    │
                       │ expenses      │
                       │ orders        │
                       │ order_items   │
                       │ menu_items    │
                       │ ...           │
                       └───────────────┘
```

---

## Data Flow Diagram

```
STEP 1: Customer Places Order
─────────────────────────────
  Customer
      │
      ├─ Selects items
      │ (Rice Bowl qty:2, Tea qty:1)
      │
      ├─ Enters customer info
      │ (Name, Phone/Address)
      │
      └─ Places order
         └─→ Supabase: orders table ✓
             └─→ Supabase: order_items table ✓
                 Order saved: id=123


STEP 2: Admin Sets Item Costs
──────────────────────────────
  Admin Dashboard
      │
      ├─ Finance Tab
      │ ├─ Cost Management Panel (NEW)
      │ │
      │ ├─ Select: "Rice Bowl"
      │ ├─ Enter: 5000 TSH cost
      │ └─ Save
      │
      └─→ Supabase: item_costs table ✓
          Record saved: 
          ├─ menu_item_id: 5
          ├─ cost_per_unit: 5000
          └─ timestamp: now


STEP 3: Financial Service Calculates
─────────────────────────────────────
  getFinancialSummary(period='daily')
      │
      ├─ Calculate Revenue
      │ ├─ Query: orders where status = 'served|delivered'
      │ ├─ Sum: menu_items.price × order_items.quantity
      │ └─ Result: 100,000 TSH
      │
      ├─ Calculate COGS
      │ ├─ Join: order_items + menu_items + item_costs
      │ ├─ Sum: item_costs.cost × order_items.quantity
      │ └─ Result: 30,000 TSH
      │
      ├─ Calculate Gross Profit
      │ ├─ Formula: Revenue - COGS
      │ ├─ Calculate: 100,000 - 30,000
      │ └─ Result: 70,000 TSH (70%)
      │
      ├─ Calculate Expenses
      │ ├─ Query: financial_expenses where expense_date in period
      │ ├─ Sum: all amounts
      │ └─ Result: 20,000 TSH
      │
      ├─ Calculate Net Profit
      │ ├─ Formula: Gross - Expenses
      │ ├─ Calculate: 70,000 - 20,000
      │ └─ Result: 50,000 TSH (50%)
      │
      └─ Calculate Item Profitability
        ├─ For each menu item:
        │ ├─ Revenue: price × qty sold
        │ ├─ COGS: cost × qty sold
        │ ├─ Profit: revenue - COGS
        │ └─ Margin: (profit / revenue) × 100
        └─ Result: Array of items with metrics


STEP 4: Dashboard Displays Data
──────────────────────────────
  Finance Tab
      │
      ├─ Metric Cards
      │ ├─ Revenue: 100,000 TSH
      │ ├─ COGS: 30,000 TSH
      │ ├─ Gross: 70,000 TSH
      │ ├─ Expenses: 20,000 TSH
      │ └─ Net: 50,000 TSH
      │
      ├─ Most Profitable Items
      │ └─ Shows top 5 items
      │
      └─ Items to Review
          └─ Shows bottom 5 items

  Reports Tab
      │
      ├─ Profit Analysis
      │ └─ Full financial breakdown
      │
      ├─ Item Profitability
      │ └─ Detailed table per item
      │
      └─ Period Selector
          ├─ Daily view
          ├─ Weekly view
          └─ Monthly view


STEP 5: Admin Makes Decisions
──────────────────────────────
  Based on data:
      │
      ├─ "Rice Bowl has 67% margin - KEEP"
      ├─ "Tea has 10% margin - INCREASE PRICE?"
      ├─ "Meat Plate has 8% margin - REDUCE COST?"
      │
      └─ Update pricing/costs
          └─ System recalculates automatically ✓
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React Components (Admin View)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AdminView.jsx (Main Container)                        │
│      │                                                  │
│      ├─ FinanceTab.jsx (ENHANCED ✨)                   │
│      │   ├─ Metric Cards (Existing)                    │
│      │   ├─ Business Intelligence Section (NEW)        │
│      │   │  ├─ ProfitAnalysisPanel (NEW)              │
│      │   │  ├─ CostManagementPanel (NEW)              │
│      │   │  └─ ItemProfitabilityTable (NEW)           │
│      │   └─ Income/Expense Forms (Existing)            │
│      │                                                  │
│      └─ ReportsTab.jsx (ENHANCED ✨)                   │
│          ├─ Metric Cards (Existing)                    │
│          ├─ Profitability Section (NEW)                │
│          │  ├─ ProfitAnalysisPanel (NEW)              │
│          │  ├─ ItemProfitabilityTable (NEW)           │
│          │  └─ Top/Bottom Items (NEW)                  │
│          └─ Charts & Tables (Existing)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  React Hooks (Data Layer)                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  useFinancialData() ✨ (New Hook)                      │
│      ├─ State: itemCosts[], expenses[]                │
│      ├─ Methods:                                       │
│      │  ├─ loadItemCosts()                            │
│      │  ├─ loadExpenses()                             │
│      │  ├─ saveItemCost()                             │
│      │  ├─ saveExpense()                              │
│      │  └─ deleteExpense()                            │
│      └─ Real-time subscriptions enabled                │
│                                                         │
│  useAdminDashboard() (Existing)                        │
│      └─ [No changes]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Service Layer (Business Logic)                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  financialService.js ✨ (New Service)                  │
│      ├─ calculateRevenue(start, end)                  │
│      ├─ calculateCOGS(start, end)                     │
│      ├─ calculateGrossProfit(start, end)              │
│      ├─ calculateExpenses(start, end)                 │
│      ├─ calculateNetProfit(start, end)                │
│      ├─ getItemProfitability(start, end)              │
│      ├─ getTopSellingItems(start, end)                │
│      ├─ getMostProfitableItems(start, end)            │
│      ├─ getLeastProfitableItems(start, end)           │
│      ├─ getFinancialSummary(period)                   │
│      └─ formatDateOnly(date)                          │
│                                                         │
│  [All calculations are pure functions]                 │
│  [All queries are optimized with joins]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Database Layer (Supabase)                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  NEW TABLES:                                           │
│  ├─ item_costs                                         │
│  │  └─ id, menu_item_id, cost_per_unit, notes        │
│  │     [Unique per menu item]                         │
│  │                                                     │
│  └─ financial_expenses                                │
│     └─ id, title, amount, type, category, date       │
│        [Many per period]                              │
│                                                         │
│  MODIFIED TABLES:                                      │
│  └─ orders                                             │
│     └─ +total_amount (optional column)                │
│                                                         │
│  EXISTING TABLES (Unchanged):                          │
│  ├─ menu_items (has price)                            │
│  ├─ orders (has created_at, status)                   │
│  ├─ order_items (has quantity, menu_item_id)          │
│  ├─ expenses (existing income/expense)                │
│  └─ ...                                                │
│                                                         │
│  INDEXES for Performance:                             │
│  ├─ idx_item_costs_menu_item_id                       │
│  ├─ idx_financial_expenses_date                       │
│  ├─ idx_financial_expenses_type                       │
│  └─ idx_orders_total_amount                           │
│                                                         │
│  ROW-LEVEL SECURITY (RLS):                            │
│  ├─ Public read access                                │
│  └─ Authenticated write access                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Query Performance

### Query 1: Get Item Costs with Menu Items
```sql
SELECT ic.*, mi.name, mi.price
FROM item_costs ic
JOIN menu_items mi ON ic.menu_item_id = mi.id
ORDER BY mi.name;

Index: idx_item_costs_menu_item_id ✓
Cost: O(n) where n = number of items
Time: <100ms typically
```

### Query 2: Calculate COGS for Period
```sql
SELECT SUM(oi.quantity * ic.cost_per_unit) as cogs
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN item_costs ic ON mi.id = ic.menu_item_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= $1 AND o.created_at <= $2
AND o.status IN ('served', 'delivered');

Indexes: Multiple ✓
Cost: O(log n) for date range
Time: <50ms typically
```

### Query 3: Calculate Revenue for Period
```sql
SELECT SUM(mi.price * oi.quantity) as revenue
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= $1 AND o.created_at <= $2
AND o.status IN ('served', 'delivered');

Indexes: idx_orders_created_at ✓
Cost: O(log n)
Time: <50ms typically
```

### Query 4: Get Financial Expenses
```sql
SELECT * FROM financial_expenses
WHERE expense_date >= $1 AND expense_date <= $2
ORDER BY expense_date DESC;

Index: idx_financial_expenses_date ✓
Cost: O(log n)
Time: <20ms typically
```

---

## Real-Time Data Flow

```
┌──────────────────┐
│ Admin Updates    │
│ Item Cost        │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Supabase Real-Time Subscription  │
│ (item_costs table)               │
└────────┬─────────────────────────┘
         │ Broadcasts change
         │ (within 1-2 seconds)
         ▼
┌──────────────────────────────────┐
│ React Component Listener         │
│ (useFinancialData hook)          │
└────────┬─────────────────────────┘
         │ Updates state
         │
         ▼
┌──────────────────────────────────┐
│ Component Re-renders             │
│ (CostManagementPanel)            │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ User Sees Updated Data           │
│ (No page refresh needed!)        │
└──────────────────────────────────┘
```

---

## State Management

### useFinancialData Hook State
```javascript
{
  itemCosts: [
    {
      id: 1,
      menu_item_id: 5,
      cost_per_unit: 5000,
      notes: "Supplier: Local Farms",
      created_at: "2026-04-29T10:00:00Z",
      updated_at: "2026-04-29T10:00:00Z",
      menu_items: { id: 5, name: "Rice Bowl", price: 15000 }
    },
    // ... more items
  ],
  financialExpenses: [
    {
      id: 1,
      title: "Monthly Rent",
      amount: 50000,
      type: "fixed",
      category: "Facilities",
      expense_date: "2026-04-29",
      created_at: "2026-04-29T10:00:00Z"
    },
    // ... more expenses
  ],
  loading: false,
  error: null
}
```

### Financial Summary State
```javascript
{
  period: "daily",
  dateRange: {
    startDate: "2026-04-29",
    endDate: "2026-04-29"
  },
  financial: {
    revenue: 100000,
    cogs: 30000,
    grossProfit: 70000,
    grossMarginPercent: 70,
    expenses: 20000,
    expensesByType: { fixed: 15000, variable: 5000 },
    netProfit: 50000,
    netMarginPercent: 50
  },
  topSellingItems: [ /* array */ ],
  mostProfitableItems: [ /* array */ ],
  leastProfitableItems: [ /* array */ ]
}
```

---

## Error Handling Strategy

```
User Action
    │
    ▼
Try/Catch Block
    │
    ├─ SUCCESS
    │  ├─ Update state
    │  ├─ Show success toast
    │  └─ Return result
    │
    └─ ERROR
       ├─ Log to console
       ├─ Set error state
       ├─ Show error toast
       └─ Return graceful fallback

Example:
save(formData)
  ├─ Try: saveToSupabase(formData)
  │  └─ Success: state = {...}
  └─ Catch: error
     ├─ console.error(error)
     ├─ notify(error.message, 'error')
     └─ return false
```

---

## Performance Optimizations

### 1. Database Level
- ✅ Proper indexes on all query columns
- ✅ Foreign key constraints
- ✅ Unique constraints to prevent duplicates
- ✅ Efficient joins using IDs

### 2. Query Level
- ✅ Use Supabase joins (not client-side)
- ✅ Only fetch needed columns
- ✅ Filter at database (not client)
- ✅ Order at database (not client)

### 3. Component Level
- ✅ Memoization where needed
- ✅ Lazy loading of components
- ✅ Minimal re-renders
- ✅ Real-time subscriptions (not polling)

### 4. State Level
- ✅ Local state for UI
- ✅ Cloud state for data
- ✅ Calculated values cached
- ✅ Period filtering optimized

---

## Backward Compatibility Guarantees

```
┌─────────────────────────────────────────────────┐
│  System Behavior                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  CUSTOMER VIEW                                  │
│  ├─ Menu browsing: ✅ UNCHANGED                │
│  ├─ Place orders: ✅ UNCHANGED                 │
│  └─ Track orders: ✅ UNCHANGED                 │
│                                                 │
│  SERVICE DESK VIEW                              │
│  ├─ See orders: ✅ UNCHANGED                   │
│  ├─ Update status: ✅ UNCHANGED                │
│  └─ Manage requests: ✅ UNCHANGED              │
│                                                 │
│  ADMIN VIEW - NON-FINANCE                       │
│  ├─ Menu management: ✅ UNCHANGED              │
│  ├─ Overview: ✅ UNCHANGED                     │
│  └─ Stock/Delivery: ✅ UNCHANGED               │
│                                                 │
│  ADMIN VIEW - FINANCE (ENHANCED)                │
│  ├─ Income tracking: ✅ UNCHANGED              │
│  ├─ Expense tracking: ✅ UNCHANGED             │
│  ├─ Period filters: ✅ UNCHANGED               │
│  └─ NEW: Cost mgmt, Profit analysis (✨)       │
│                                                 │
│  DATABASE TABLES                                │
│  ├─ All existing: ✅ UNCHANGED                 │
│  ├─ New tables: ✅ NON-BREAKING                │
│  └─ New column: ✅ DEFAULT VALUE               │
│                                                 │
│  EXISTING DATA                                  │
│  ├─ All orders: ✅ PRESERVED                   │
│  ├─ All menu items: ✅ PRESERVED               │
│  ├─ All expenses: ✅ PRESERVED                 │
│  └─ No deletions: ✅ GUARANTEED                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ **Scalability**: Optimized queries and indexes
- ✅ **Performance**: Real-time data with minimal latency
- ✅ **Maintainability**: Clean separation of concerns
- ✅ **Safety**: No breaking changes
- ✅ **Reliability**: Error handling throughout
- ✅ **Security**: RLS policies on all new tables
