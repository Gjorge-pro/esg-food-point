// ⚠️ IMPORTANT: Menu items are now stored ONLY in Supabase database
// To add/manage menu items, use the Admin panel or insert directly into the database
// See supabase/schema.sql for database structure
// REMOVED: demoMenuItems - Always fetch from database using admin interface

export const demoOrders = [
  {
    id: 101,
    order_type: 'dine_in',
    customer_name: 'Walk-in customer',
    phone: null,
    address: null,
    table_number: 'Table 3',
    status: 'cooking',
    created_at: new Date().toISOString(),
    order_items: [
      { id: 'a', quantity: 2, menu_items: { id: 1, name: 'Coconut Rice Bowl', price: 12000 } },
      { id: 'b', quantity: 1, menu_items: { id: 3, name: 'Passion Cooler', price: 4500 } },
    ],
    total_amount: 28500,
  },
  {
    id: 102,
    order_type: 'delivery',
    customer_name: 'Neema',
    phone: '+255712345678',
    address: 'Mikocheni, Dar es Salaam',
    table_number: null,
    status: 'ready',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    order_items: [
      { id: 'c', quantity: 1, menu_items: { id: 2, name: 'Nyama Choma Plate', price: 18000 } },
      { id: 'd', quantity: 2, menu_items: { id: 4, name: 'Ginger Tea', price: 3000 } },
    ],
    total_amount: 24000,
  },
];
