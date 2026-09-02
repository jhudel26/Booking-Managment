# Rimreserve

A production-ready booking management web application built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Designed for deployment via **GitHub → Vercel → Supabase**.

## Features

- **Public Calendar** — View availability and daily schedules without login
- **Admin Portal** — Create booking requests with automatic price calculation
- **Super Admin Dashboard** — Approve/reject/cancel bookings, manage users, configure pricing
- **Role-Based Access Control** — User, Admin, and Super Admin roles with Supabase RLS
- **Booking Conflict Protection** — Server-side and database-level overlap prevention
- **Price History** — Historical booking prices preserved when rates change
- **Audit Logging** — Track important system actions
- **Dark Mode** — Light, dark, and system theme support
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Asia/Manila Timezone** — Consistent time display

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + PostgreSQL + RLS)
- React Hook Form + Zod
- TanStack Query
- Recharts

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rimreserve
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon key** from Settings → API
3. Note your **service_role key** (keep this secret — server-side only)

### 4. Configure the database

1. Open the Supabase SQL Editor
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. This creates all tables, RLS policies, triggers, and default settings

### 5. Create the first Super Admin

> **If you see "Database error creating new user"** when adding a user in Supabase Auth,
> run `supabase/migrations/002_fix_profile_trigger.sql` in the SQL Editor first, then try again.

1. Open **Supabase SQL Editor** and run `supabase/migrations/002_fix_profile_trigger.sql`
2. Go to **Authentication → Users → Add user**
3. Enter email and password (leave **User Metadata** empty)
4. Run in SQL Editor (replace the email):

```sql
UPDATE public.profiles
SET role = 'super_admin', full_name = 'Super Administrator', is_active = true
WHERE email = 'your-email@example.com';
```

5. Verify:

```sql
SELECT id, email, role, is_active FROM public.profiles WHERE email = 'your-email@example.com';
```

If the user exists in Auth but has no profile row, see `supabase/setup_super_admin.sql` Option B.

See `supabase/setup_super_admin.sql` for details.

### 6. Configure authentication

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000` (or your production URL)
- **Redirect URLs**: Add `http://localhost:3000/login` and your production URL

### 7. Set environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 8. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public calendar.

### 9. Push to GitHub

```bash
git init
git add .
git commit -m "Initial booking management system"
git remote add origin <your-repo-url>
git push -u origin main
```

### 10. Deploy to Vercel

1. Import your GitHub repository in [Vercel](https://vercel.com)
2. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
3. Deploy

Update Supabase Auth redirect URLs to include your Vercel domain.

## User Roles

| Role | Capabilities |
|------|-------------|
| **Public User** | View calendar and availability |
| **Admin** | Create booking requests, view own bookings |
| **Super Admin** | Approve/reject bookings, manage admins, configure pricing |

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    api/                # API routes (server-side)
    admin/              # Admin dashboard
    super-admin/        # Super Admin dashboard
    login/              # Authentication
  components/           # React components
    calendar/
    booking/
    dashboard/
    layout/
    ui/
  lib/                  # Utilities and services
    supabase/
    auth/
    booking/
    validation/
supabase/
  migrations/           # Database schema
  seed.sql              # Optional dev seed data
  setup_super_admin.sql # Initial admin setup
```

## Booking Workflow

```
Admin creates booking → PENDING → Super Admin reviews → APPROVED / REJECTED
```

- **Approved** and **Pending** bookings block time slots
- **Rejected** and **Cancelled** bookings release time slots
- Prices are calculated server-side and stored per booking

## Security

- Row Level Security (RLS) on all tables
- Service role key used only in API routes (never exposed to browser)
- Server-side price calculation and validation
- Database-level booking conflict triggers
- Role-based route protection

## Development Seed Data

See `supabase/seed.sql` for optional sample data. **Never use default passwords in production.**

## License

MIT

---

**Rimreserve** - Professional Booking Management System
