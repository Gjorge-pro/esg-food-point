# ESG FOOD POINT

Restaurant ordering and delivery MVP built with React, Tailwind CSS, and Supabase realtime.

## Features

- Customer ordering flow with dine-in and delivery support
- Service desk dashboard for live order handling
- Admin menu management and basic analytics
- Realtime sync for orders and menu updates
- Mobile responsive single-page interface

## Stack

- React + Vite
- Tailwind CSS
- Supabase PostgreSQL + Realtime
- Vercel deployment ready

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and add:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the SQL in [schema.sql](/e:/desk/code_for_life/Real%20Project/ESG%20FOODPOINT/supabase/schema.sql) in the Supabase SQL editor.

4. Create staff accounts in Supabase Auth, then add matching rows in `public.users` using the auth user UUID and a role of `admin`, `service_desk`, or `kitchen`.

5. Start development:

```bash
npm run dev
```

## MVP flow

- Customers can browse menu items, choose dine-in or delivery, and place an order without logging in.
- Service desk sees new orders instantly and advances status from pending to served or delivered.
- Admin can add, edit, delete, and hide menu items while viewing simple analytics.
- Order tracking updates in real time using Supabase subscriptions.

## Security note

- Customers are anonymous for the MVP.
- Staff write access is intended to be used with authenticated Supabase users for admin and service operations.
- If env vars are missing, the app shows demo data so the UI still loads cleanly.
