# Database-First Menu System - Setup Guide

## 🎯 What Changed
- **Menu items now load ONLY from Supabase database** (no demo data)
- **Admin panel updated** to manage menu items directly in database
- **Categories are hierarchical**: Main Categories → Subcategories
- **Order placement** fully integrated with database

---

## 🚀 Quick Start

### Step 1: Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com)
2. Create/login to your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** (VITE_SUPABASE_URL)
   - **Anon Key** (VITE_SUPABASE_ANON_KEY)

### Step 2: Create `.env` File
Copy `.env.example` to `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Deploy Database Schema
1. In Supabase, go to **SQL Editor**
2. Create new query
3. Paste entire contents of `supabase/schema.sql`
4. Click **Run**

This creates:
- ✅ `categories` table (main + subcategories)
- ✅ `menu_items` table
- ✅ `orders` table
- ✅ `order_items` table
- ✅ `requests` table (for dine-in call waiter/bill requests)
- ✅ `feedback` table
- ✅ `users` table (for staff)
- ✅ Row-level security (RLS) policies

---

## 📝 How to Add Menu Items

### Method A: Using Admin Dashboard (Recommended)
1. **Create Staff Account**:
   - Go to Supabase → **Authentication** → **Users**
   - Click **Create new user**
   - Email: `admin@esgfood.com`
   - Password: `Admin@123456`
   - Confirm

2. **Visit Admin Page**:
   - Navigate to `http://localhost:5173/admin`
   - Sign in with admin@esgfood.com / Admin@123456
   - Use the **Menu Management** form to add items:
     - Name: `Coconut Rice Bowl`
     - Price: `15000` (TSH)
     - Main Category: `Meals` → Subcategory: `Lunch`
     - Toggle "Available"
     - Click **Create item**

3. **Menu appears immediately**:
   - Refresh customer page
   - Item shows under Meals → Lunch

### Method B: Direct Database Insert (SQL)
1. Supabase → **SQL Editor** → New query:

```sql
-- First, get the category IDs
SELECT id, name, parent_id FROM categories ORDER BY name;
-- Look for: Lunch (parent_id: <meals_id>), Breakfast, etc.

-- Then insert menu item:
INSERT INTO menu_items (name, price, category_id, available)
VALUES ('Nyama Choma Plate', 25000, <lunch_id>, true);
```

---

## 🏗️ Database Schema Overview

### Categories (Hierarchical)
```
Meals (id: 1, parent_id: null)
  └─ Breakfast (id: 11, parent_id: 1)
  └─ Lunch (id: 12, parent_id: 1)
  └─ Dinner (id: 13, parent_id: 1)

Drinks (id: 2, parent_id: null)
  └─ Soft Drinks (id: 21, parent_id: 2)
  └─ Hot Drinks (id: 22, parent_id: 2)
  └─ Juices (id: 23, parent_id: 2)

Specials (id: 3, parent_id: null)
  └─ Today's Special (id: 31, parent_id: 3)
  └─ Chef's Special (id: 32, parent_id: 3)

Snacks (id: 4, parent_id: null)
  └─ Bites (id: 41, parent_id: 4)
  └─ Fries (id: 42, parent_id: 4)
```

### Menu Items
```javascript
{
  id: bigint,
  name: text,
  price: numeric(10,2),  // Tanzanian Shilling
  category_id: bigint,   // FK to subcategories
  available: boolean,    // Controls visibility
  created_at: timestamptz
}
```

### Orders → Order Items Flow
```
Customer places order
  ↓
Order created (dine_in or delivery, pending status)
  ↓
Order items created (links menu_items by ID, quantity, instructions)
  ↓
Status progresses: pending → accepted → cooking → ready → served/delivered
  ↓
Real-time updates via Supabase Realtime subscription
```

---

## 🔐 Staff Role Setup (Optional)

Create additional staff accounts for service desk and kitchen:

```sql
-- In Supabase Auth, create these accounts:
-- Email: desk@esgfood.com / Password: Desk@123456
-- Email: kitchen@esgfood.com / Password: Kitchen@123456

-- Then in SQL Editor, insert to users table:
-- (You'll need their UUIDs from Auth → Users page)

INSERT INTO public.users (id, name, role)
VALUES 
  ('UUID_HERE', 'Service Desk Staff', 'service_desk'),
  ('UUID_HERE', 'Kitchen Chef', 'kitchen');
```

---

## 👥 User Flows After Setup

### Customer Journey
1. Visit `http://localhost:5173`
2. Select **Delivery** or **Dine-In**
3. Browse **Menu** (loads categories from DB)
4. Select items and add to cart
5. **Checkout** with name, phone/address, payment method
6. **Order placed** → See real-time tracking

### Admin Dashboard
1. Visit `http://localhost:5173/admin`
2. Sign in as `admin@esgfood.com`
3. **Add/Edit/Delete menu items** in left panel
4. **View analytics** (total revenue, order counts)
5. **See operations feed** (recent orders)

### Service Desk View
1. Visit `http://localhost:5173/service-desk`
2. Sign in as `desk@esgfood.com`
3. See **pending orders** in left panel
4. Click order to see details and **update status**
5. Categories: not started → accepted → cooking → ready → served/delivered

---

## ⚙️ How It All Connects

### Frontend
```
CustomerPage
  ├─ useCategories() hook
  │  └─ Fetches categories (+ demo fallback if no Supabase)
  │
  └─ MenuBrowser Component
     ├─ Displays Main Categories (Meals, Drinks, Specials, Snacks)
     ├─ User selects Main Cat
     ├─ Loads Subcategories (Lunch, Breakfast, etc.)
     ├─ User selects Subcategory
     └─ Fetches Menu Items for that subcategory (database only!)

CheckoutForm
  └─ Submits to CustomerFlow.handlePlaceOrder()
     ├─ Creates Order in database
     ├─ Creates OrderItems (links menu_items)
     └─ Returns to OrderTracking with real-time updates
```

### Backend Data Flow
```
Supabase Categories Table
  ↓
useCategories.fetchCategories()
  ↓
MenuBrowser displays hierarchy
  ↓
User selects subcategory
  ↓
useCategories.fetchMenuItemsByCategory(categoryId)
  ↓
Menu items display with prices from DB
  ↓
Customer adds to cart → Checkout
  ↓
Order + OrderItems inserted to Supabase
  ↓
ServiceDesk/Admin see realtime updates
```

---

## 🐛 Troubleshooting

### Menu shows "No items" even after adding them
**Problem**: Database not configured or categories not loaded  
**Solution**:
1. Check browser console (F12 → Console)
2. Look for error messages with red ❌
3. Verify .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
4. Restart dev server: `npm run dev`

### Admin page doesn't open
**Problem**: Staff auth not working  
**Solution**:
1. Make sure you created the staff user in Supabase → Authentication → Users
2. Use correct credentials email/password  
3. Check browser console for auth errors

### Order placement fails
**Problem**: Database connection issues  
**Solution**:
1. Check RLS policies are enabled (should be from schema.sql)
2. Verify order_items table has proper foreign keys
3. Check category_id exists in menu_items (try SQL query: `SELECT category_id FROM menu_items;`)

### Menu items not visible to customer but admin can see them in database
**Problem**: `available` flag is false  
**Solution**:
1. In admin panel, click **Edit** on item
2. Toggle "Available for customers to order now"
3. Click **Update item**

---

## 📊 Admin Analytics Shown

When signed in as admin:
- **Live orders** - Total count
- **Cooking now** - Status = 'cooking'
- **Ready or served** - Status in (ready, served, delivered)
- **Total revenue** - Sum of order amounts
- **Delivery vs Dine-in** breakdown
- **Operations feed** - Last 6 orders with status

---

## 🎬 Next Steps

After menu items are added:

1. **Test Order Flow**:
   - Place test order as customer
   - See it appear on service desk
   - Update status in service desk
   - Watch customer tracking page update

2. **Enable Real-time Updates** (Already configured):
   - Supabase Realtime subscription active
   - Orders, order_items, categories published
   - WebSocket connection auto-managed

3. **Add More Categories** (Optional):
   - Go to SQL Editor
   - Insert new main/subcategories
   - Reload to see in menu

4. **Customize Prices/Items**:
   - Use Admin dashboard to manage
   - All changes appear to customers immediately

---

## 💡 Design Pattern Used

- **Database-First**: Menu items only in Supabase
- **Hierarchical Categories**: Unlimited depth support (though UI shows 2 levels)
- **RLS Security**: All tables have public read, authenticated create/update
- **Real-time**: Supabase Realtime for order updates
- **Graceful Fallback**: Demo categories if Supabase unavailable (but no menu items)
- **Admin Control**: All menu management through authenticated admin panel

All menu items, categories, and orders are now controlled through the database!
