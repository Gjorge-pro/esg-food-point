# 🚀 Quick Start Checklist

Your application is now running on **http://localhost:5173** with a database-first menu system!

## Before You Start Using It

### ☐ Step 1: Get Supabase Credentials (2 min)
1. Visit [supabase.com](https://supabase.com)
2. Login or create account
3. Create/select a project
4. Go to **Settings** → **API**
5. Copy the **Project URL** and **Anon Key**

### ☐ Step 2: Configure `.env` (1 min)
Copy `.env.example` to `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then restart dev server: `npm run dev`

### ☐ Step 3: Deploy Database Schema (2 min)
1. In Supabase, go to **SQL Editor**
2. Create **New query**
3. Copy-paste entire contents of `supabase/schema.sql`
4. Click **Run**

This creates:
- ✅ categories (main + subcategories)
- ✅ menu_items (with prices in TSH)
- ✅ orders
- ✅ order_items
- ✅ requests (for dine-in call waiter/bill)
- ✅ feedback
- ✅ users (for staff)

### ☐ Step 4: Create Admin Account (1 min)
In Supabase **Authentication** → **Users**:
- Click **Create new user**
- Email: `admin@esgfood.com`
- Password: `Admin@123456`

### ☐ Step 5: Add Menu Items (1 min per item)

**Option A: Via Admin Dashboard (Easiest)**
1. Visit `http://localhost:5173/admin`
2. Sign in: `admin@esgfood.com` / `Admin@123456`
3. Scroll down to "Menu management"
4. Fill in the form:
   - Item name: `Coconut Rice Bowl`
   - Price: `15000`
   - Main Category: `Meals` → Sub Category: `Lunch`
   - Toggle "Available"
5. Click **Create item**

**Option B: Via SQL (Bulk)**
Run this in Supabase SQL Editor:
```sql
INSERT INTO menu_items (name, price, category_id, available)
VALUES 
  ('Coconut Rice Bowl', 15000, 12, true),
  ('Nyama Choma Plate', 25000, 12, true),
  ('Ginger Tea', 3000, 22, true);
```

(Need category IDs? Run: `SELECT id, name, parent_id FROM categories;`)

---

## Test It Out

### As a Customer
1. Visit `http://localhost:5173`
2. Click **Delivery** or **Dine-In**
3. See menu loaded from database → `✅ Menu items loaded for category X: Y items`
4. Select items, add to cart
5. Checkout with name, phone/address, payment method
6. Place order → See "✅ Order placed successfully!"
7. Watch real-time tracking

### As Admin
1. Visit `http://localhost:5173/admin`
2. Sign in with credentials above
3. See:
   - **Menu management** form to add/edit/delete items
   - **Analytics** showing orders, revenue
   - **Operations feed** showing recent orders

### As Service Desk
1. Create staff account:
   - Email: `desk@esgfood.com`
   - Password: `Desk@123456`
2. Visit `http://localhost:5173/service-desk`
3. Sign in
4. See pending orders
5. Update order status: pending → accepted → cooking → ready → served/delivered
6. Watch notifications as status changes

---

## What Changed From Before

| Before | After |
|--------|-------|
| Menu items in demo data | Menu items ONLY in database |
| Hardcoded menu in code files | Managed via admin panel |
| Demo fallback for items | Demo fallback for categories only |
| Manual code changes to add items | Live admin updates |

---

## File Locations Reference

```
src/
  ├── hooks/
  │   ├── useCategories.js ← Loads categories from DB
  │   ├── useRestaurantData.js ← Loads orders for admin/service desk
  │   └── useMenuOnly.js ← Legacy (not used, but fixed)
  │
  ├── features/
  │   ├── customer/
  │   │   ├── MenuBrowser.jsx ← Displays hierarchical menu
  │   │   ├── CheckoutForm.jsx ← Order placement
  │   │   ├── CustomerFlow.jsx ← Order orchestration
  │   │   └── OrderTracking.jsx ← Track order status
  │   │
  │   ├── admin/
  │   │   └── AdminView.jsx ← Manage menu items ✨ (UPDATED)
  │   │
  │   └── service/
  │       └── ServiceDeskView.jsx ← See/update orders
  │
  ├── lib/
  │   ├── demoData.js ← Only has demoOrders now (menu items removed)
  │   ├── supabaseClient.js ← Supabase connection
  │   └── formatters.js ← Helper functions
  │
  └── pages/
      ├── CustomerPage.jsx
      ├── AdminPage.jsx
      └── ServiceDeskPage.jsx

.env.example ← Copy to .env and configure
DATABASE_SETUP.md ← Detailed setup guide
IMPLEMENTATION_SUMMARY.md ← Technical summary
supabase/schema.sql ← Database structure
```

---

## Console Logs to Look For

When browsing the menu, open browser **DevTools (F12 → Console)** and look for:

### Good Logs ✅
```
✅ Main categories loaded: 4
✅ Menu items loaded for category 12: 3 items
✅ Order placed successfully!
```

### Problem Logs ❌
```
⚠️ Supabase not configured - no menu items available
→ Fix: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env

❌ Error fetching menu items: [error details]
→ Fix: Check Supabase setup, ensure schema.sql was deployed
```

---

## Troubleshooting

### Menu shows nothing
1. Check browser console for error message
2. Verify `.env` has correct URL and key
3. Verify schema.sql was deployed (run: `SELECT COUNT(*) FROM categories;`)
4. Add menu items via admin panel
5. Restart dev server: `npm run dev`

### Admin page won't open
1. Create staff user in Supabase Auth
2. Use correct email/password
3. Check browser console for auth errors
4. Ensure Supabase is configured

### Orders don't save
1. Check Supabase SQL Editor for errors
2. Verify order_items table has correct foreign keys
3. Check RLS policies are enabled (should be from schema.sql)
4. Try placing order and check database directly

---

## Key Endpoints

- **Customer**: `http://localhost:5173/` 
- **Admin**: `http://localhost:5173/admin`
- **Service Desk**: `http://localhost:5173/service-desk`
- **Orders History**: `http://localhost:5173/order-history`

---

## Next: Create More Staff Accounts

In Supabase **Authentication** → **Create new user**:

```
Kitchen Staff:
  Email: kitchen@esgfood.com
  Password: Kitchen@123456
  (Then assign role 'kitchen' in users table)

Service Desk Manager:
  Email: manager@esgfood.com
  Password: Manager@123456
  (Then assign role 'service_desk' in users table)
```

---

## Ready to Go!

Your application now has:
- ✅ Database-first menu system
- ✅ Admin panel for menu management
- ✅ Real-time order tracking
- ✅ Staff access control
- ✅ Hierarchical categories

**Just configure Supabase and start using it!** 🎉
