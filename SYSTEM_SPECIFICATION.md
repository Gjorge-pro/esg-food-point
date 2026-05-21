# ESG FOODPOINT - System Specification

A real-time restaurant ordering system with real-time synchronization between Customer View and Service Desk View.

## 🧠 CORE OBJECTIVE

Create a system where:
- Customers can browse menu, place orders, and track them
- Service Desk receives orders, manages them, and updates status
- Menu availability is controlled live by Service Desk
- All updates reflect **instantly** across both views (no page reload)

---

## 🔗 CORE REAL-TIME CONNECTIONS

### Customer → Service Desk:
- ✅ New order creation
- ✅ Customer requests (call waiter, request bill)
- ✅ Payment selection

### Service Desk → Customer:
- ✅ Order status updates (pending → accepted → cooking → ready → served/delivered)
- ✅ Estimated time updates
- ✅ Payment confirmation
- ✅ Menu availability updates

---

## 📦 DATABASE STRUCTURE

### `orders`
```
id (bigint)
order_type (dine_in | delivery)
customer_name (text)
phone (text)
address (text)
table_number (text)
status (pending | accepted | cooking | ready | on_the_way | served | delivered)
payment_method (cash | mobile_money | card)
payment_status (pending | paid | failed)
estimated_time_minutes (integer)
created_at (timestamptz)
```

### `order_items`
```
id (bigint)
order_id (FK → orders.id)
menu_item_id (FK → menu_items.id)
quantity (integer)
instructions (text)
created_at (timestamptz)
```

### `categories`
```
id (bigint)
name (text)
parent_id (FK → categories.id, self-referencing for hierarchy)
created_at (timestamptz)
```

### `menu_items`
```
id (bigint)
name (text)
price (numeric)
category_id (FK → categories.id)
available (boolean) ← CRITICAL FOR REAL-TIME
created_at (timestamptz)
```

### `requests`
```
id (bigint)
order_id (FK → orders.id)
type (call_waiter | request_bill)
status (pending | fulfilled)
created_at (timestamptz)
```

---

## 🟢 CUSTOMER VIEW FEATURES

### A. Menu System ✅
**View:** Categories → Subcategories → Items
**Display:**
- Item name
- Price (in TSH - Tanzanian Shilling)
- Availability badge

**Behavior:**
- If `available = false`:
  - Show "Out of Stock" label
  - Disable "Add to Cart" button
  - Gray out item visually

### B. Ordering ✅
- Add items to cart
- Adjust quantities (+ / -)
- Add special instructions
- Select order type:
  - **Dine-in** (table number)
  - **Delivery** (address)

### C. Checkout ✅
**For Dine-in:**
- Enter customer name
- Enter table number

**For Delivery:**
- Enter customer name
- Enter phone number
- Enter delivery address

**Payment Options:**
- Cash on delivery
- Mobile Money (e.g., M-Pesa)
- Card (mock)

### D. Order Tracking ✅
**Status Timeline:**
```
pending → accepted → cooking → ready → (on_the_way) → delivered/served
```
- Show current status with badge color
- Display estimated time remaining
- Update in real-time (no reload)

### E. Requests ✅
- **Call Waiter:** Send request to Service Desk
- **Request Bill:** Signal ready to pay
- Real-time notification to Service Desk

---

## 🟡 SERVICE DESK VIEW FEATURES

### A. Real-Time Orders Dashboard ✅
- View all orders instantly
- Filter by:
  - Order type (dine-in / delivery)
  - Status (pending, cooking, ready, etc.)
  - Payment status (pending / paid)

### B. Order Management ✅
- Accept order
- Mark cooking
- Mark ready
- Mark delivered/served
- Update payment status
- One-click actions

### C. Order Details Panel ✅
View:
- All items with quantities
- Special instructions
- Customer info (phone, address, table)
- Order time
- Status history

### D. Customer Requests Panel ✅
View:
- Call waiter requests
- Request bill requests
- Mark as handled
- Real-time notifications

### E. Menu Availability Control ✅
- View menu (same hierarchy as customer)
- Toggle item status:
  - `available: true` ⇄ `available: false`
- One-click update (no forms)
- Updates sync instantly to customers

---

## 🔵 MENU AVAILABILITY MANAGEMENT (CRITICAL)

### Service Desk Actions:
```
Menu Item [ ✓ Available ]  ←→  [ ✗ Out of Stock ]
```
- Single click to toggle
- No confirmation needed
- Updates to database instantly

### Customer Impact:
- Sees "Out of Stock" label
- Cannot add to cart
- If added before becoming unavailable, allow completion (with warning)

### Real-Time Sync:
- Subscribe to `menu_items` table
- On change → update UI instantly
- No page reload needed

---

## 🔔 REAL-TIME REQUIREMENTS

### Use Supabase Realtime:
**Subscribe to:**
- `orders` (new orders, status changes)
- `order_items` (item details)
- `requests` (waiter calls, bill requests)
- `menu_items` (availability changes)

**Update Instantly When:**
- New order created
- Order status changes
- Request added
- Menu item availability changes
- Payment status updates

### Implementation:
```typescript
// Example subscription
const channel = supabase
  .channel('orders-realtime')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order update:', payload);
      // Update UI instantly
    }
  )
  .subscribe();
```

---

## 🧩 UI STRUCTURE

### Customer View:
```
App
├── OrderTypeSelector (dine-in vs delivery)
├── MenuBrowser (categories → items)
├── CartPanel (review items, quantities)
├── CheckoutForm (customer info + payment)
└── OrderTracking (real-time status timeline)
```

### Service Desk View:
```
ServiceDeskView
├── OrdersPanel (all orders with filters)
├── OrderDetailPanel (order items + info)
├── RequestsPanel (waiter calls, bill requests)
├── ProductionPanel (cooking orders)
├── MenuAvailabilityPanel (toggle items)
└── FinancePanel (payment tracking)
```

---

## 🎨 UI REQUIREMENTS

- ✅ React (functional components + hooks)
- ✅ Tailwind CSS
- ✅ Mobile responsive
- ✅ Clean and fast UI
- ✅ Status badges (color-coded)
- ✅ Disable unavailable items visually
- ✅ Real-time animations/updates
- ✅ Clear action buttons
- ✅ Toast notifications for feedback

---

## ⚠️ IMPORTANT RULES

- ✅ **NO authentication required** (MVP phase)
- ✅ **Real-time updates** (NO page reload)
- ✅ **Fast interactions** (one-click actions)
- ✅ **Prevent ordering unavailable items**
- ✅ **Ensure consistency** between views
- ✅ **Error handling** with user feedback
- ✅ **RLS policies** for public read/write access

---

## 🎯 IMPLEMENTATION CHECKLIST

### Core Tables:
- [x] categories (with parent_id for hierarchy)
- [x] menu_items (with available flag)
- [x] orders (with status flow)
- [x] order_items
- [x] requests
- [x] feedback

### Customer Features:
- [x] Menu browsing (3-tier hierarchy)
- [x] Add to cart
- [x] Cart review
- [x] Checkout (dine-in + delivery)
- [x] Order tracking with status timeline
- [x] Real-time order status updates
- [x] Waiter call & bill request
- [x] Order history

### Service Desk Features:
- [x] Orders dashboard
- [x] Order detail view
- [x] Status workflow (accept → cooking → ready → served)
- [x] Payment status management
- [x] Customer requests panel
- [x] Menu availability toggle
- [x] Production tracking
- [x] Finance report

### Real-Time:
- [x] Supabase Realtime subscriptions
- [x] Orders sync
- [x] Menu availability sync
- [x] Requests sync
- [x] No polling (pure event-driven)

### Mobile/Responsive:
- [x] Customer view mobile-friendly
- [x] Service Desk tablet-optimized
- [x] Touch-friendly buttons (min 44px)

---

## 🚀 FINAL GOAL

Build a system where:
1. **Customer and Service Desk are live-connected** (real-time WebSocket)
2. **Service Desk has full control** over orders, statuses, and menu
3. **Customers see instant updates** (no reload)
4. **Zero authentication overhead** (MVP simplicity)
5. **Production-ready** (error handling, edge cases)

---

## 📝 TECH STACK

- **Frontend:** React 18.3 + Vite 5.4
- **Styling:** Tailwind CSS 3.4
- **Backend:** Supabase PostgreSQL
- **Real-time:** Supabase Realtime (WebSocket)
- **Router:** React Router v6
- **Icons:** Lucide React
- **State:** React Hooks (useRestaurantData, useCategories, etc.)

---

## 🔧 LOCAL SETUP

```bash
# Install dependencies
npm install

# Create .env with Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Deploy schema.sql to Supabase SQL Editor
# (See DATABASE_SETUP.md)

# Start dev server
npm run dev

# Access
# Customer: http://localhost:5173
# Service Desk: http://localhost:5173/servicedesk
```

---

## 📚 Related Documentation

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Schema deployment guide
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature status
- [QUICK_START.md](QUICK_START.md) - First-time guide
