# Rimreserve 🏀

> **Basketball Court Booking Management System for St. Joseph Village 6 Phase 4 HOA** — Cabuyao City, Laguna

A production-ready court reservation platform built with **Next.js 16 (App Router)**, **TypeScript 5**, **Tailwind CSS 4**, **Framer Motion**, and **Supabase (PostgreSQL + RLS + Auth)**. Designed for end-to-end deployment via **GitHub → Vercel → Supabase**.

---

## ✨ Features

### Public Site
- **Public Calendar** — Interactive month calendar + daily schedule view with no login required
- **Public Booking Form** — Walk-in guests can submit reservation requests directly from the landing page (created with anonymous requester info)
- **Real-time Availability** — Time slots visually blocked for Approved and Pending bookings; Rejected/Cancelled slots stay open
- **Automatic Price Calculation** — Hourly × duration, with on-form breakdown before submission
- **Dark / Light / System Theme** — Persistent theme switcher with smooth transitions
- **Responsive** — Mobile, tablet, and desktop layouts

### Admin Dashboard (`/admin/*`)
- **Calendar + Booking Creation** — Admins reserve slots on behalf of residents
- **My Bookings** — Filterable list by status, with action buttons (Cancel, View Details)
- **Booking Detail Dialog** — Full timeline: request info, status history, actions taken
- **Booking Status Management** — Admins with delegated `can_approve_bookings` permission can Approve/Reject pending requests
- **User Directory** — For admins with delegated `can_create_admin` flag
- **Court Rate Settings** — For admins with delegated `can_manage_rates` flag (rate changes preserve history)
- **Password Reset** — Email-based forgot-password flow via Supabase magic links

### Super Admin Dashboard (`/super-admin/*`)
- **Approval Queue** — Pending bookings table with Approve/Reject modal with optional reason notes
- **Bookings Management** — Full CRUD + filtering by status, date range, requester
- **User Management** — Create admin accounts, toggle active status, assign role, grant/revoke delegated capability flags, trigger password resets
- **Court Rate Configuration** — Price per hour changes with full audit history (old bookings keep historical rates)
- **Dashboard Analytics** — Recharts visualizations:
  - Total Bookings, Pending, Approved, Rejected/Cancelled counts
  - Revenue / Status Breakdown / Trends Over Time
  - Top Requesters (frequency ranking)
  - Approval Rate KPI
- **Excel Export** — One-click `.xlsx` download of all bookings (with status, pricing, requester details columns) for HOA bookkeeping

### Permission & Security
- **Three core roles** (`user`, `admin`, `super_admin`) as a Postgres Enum
- **Granular delegation flags** (admins can be granted `can_approve_bookings`, `can_create_admin`, `can_manage_rates`, `can_grant_admin_permissions` individually — no need for blanket super-admin)
- **Dual-layer Booking Conflict Detection** — App-level `datesOverlap()` check **plus** a DB trigger `check_booking_conflict()` guarantees correctness even if the app check is bypassed
- **Row Level Security (RLS)** on every table
- **DB-triggered Status History** — Every `bookings.status` transition is automatically saved to `booking_status_history` with timestamp + actor
- **Audit Logging** — App-level `logAudit()` captures important mutations (user creation, role changes, approvals, price updates, cancellations)
- **Site Health Loading Screen** — Splash screen with 4 real status checks (Hydrate → Connect to Supabase → Load bookings data → Finalize) with live progress % and a checklist instead of a fake fixed timer

---

## 🛠️ Tech Stack

| Layer | Package |
|---|---|
| Framework | **Next.js 16.3.4** (App Router, React 19, Server Components + Actions) |
| Language | **TypeScript 5** (strict mode) |
| Styling | **Tailwind CSS 4** + `class-variance-authority` + `clsx` + `tailwind-merge` |
| UI Primitives | **Radix UI** (Dialog, Popover, Select, Switch, Tabs, Toast, DropdownMenu, etc.) |
| Animations | **Framer Motion 13** (spring transitions, staggered reveals, micro-interactions) |
| Icons | `lucide-react` + custom SVG basketball icon |
| Forms | **React Hook Form 7** + **Zod 3** validation schemas |
| State/Data Fetching | **TanStack React Query 5** (Provider configured; ready to adopt `useQuery`/`useMutation`) |
| Charts & Analytics | **Recharts 3** (Bar, Pie, Line) |
| Spreadsheet Export | **SheetJS (`xlsx`) 0.18** |
| Auth & Database | **Supabase** (`@supabase/supabase-js` + `@supabase/ssr` for App Router SSR client) |
| Time / Dates | `date-fns` 4 + `date-fns-tz` (all times normalized to **Asia/Manila**) |
| Notifications | **Sonner 2** toast + Radix Toast + DB `notifications` table trigger (auto-sent on booking status changes) |
| CAPTCHA (spam guard, ready) | `@marsidev/react-turnstile` (Cloudflare Turnstile — dependency installed, ready to wire) |
| Theme | `next-themes` |
| Linting | `eslint` + `eslint-config-next@16.3.4` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.17 (Next.js 16 requirement)
- npm (or equivalent package manager)
- A Supabase account (free tier works great for an HOA)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd rimreserve
npm install
```

### 2. Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** → New Project
2. Note 3 values from **Settings → API**:
   - `Project URL` (e.g. `https://xxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (⚠️ **KEEP SECRET** — never commit this or put it in client code)

### 3. Apply the database schema

1. Open the **Supabase SQL Editor** → New Query
2. Paste and run the entire contents of [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)

This creates:
- 9 tables (`profiles`, `bookings`, `system_settings`, `booking_status_history`, `audit_logs`, `notifications`, `notifications_preferences`, `price_history`, plus the Supabase auth.users base)
- 2 custom Postgres Enum types (`user_role`, `booking_status`)
- All Row Level Security (RLS) policies
- Triggers:
  - `handle_new_user` → auto-creates a `profiles` row + sends welcome notification on sign-up
  - `check_booking_conflict` → DB-level overlap guard on insert/update
  - `log_booking_status_change` → auto history entries on every status change
  - `notify_booking_status_change` → auto row in `notifications` for assignee
  - `on_price_change` → auto `price_history` snapshot
- Default system setting (200 PHP per hour effective Sep 2, 2026)

> 💡 **If `user_role` type already exists** (SQLSTATE 42710): the migration file wraps `CREATE TYPE` in idempotent `DO ... pg_type` checks. If you still get errors, run a clean Supabase project or `DROP TYPE IF EXISTS user_role CASCADE; DROP TYPE IF EXISTS booking_status CASCADE;` first.

### 4. Bootstrap the first Super Admin

1. Go to **Supabase → Authentication → Users → Add user** (email + password). **Leave User Metadata empty.**
2. In the SQL Editor, promote the profile (replace the email):

```sql
UPDATE public.profiles
SET
  role        = 'super_admin',
  full_name   = 'HOA Super Administrator',
  is_active   = true,
  can_create_admin           = true,
  can_approve_bookings       = true,
  can_manage_rates           = true,
  can_grant_admin_permissions = true
WHERE email = 'your-email@example.com';
```

3. Verify:

```sql
SELECT id, email, role, is_active,
       can_create_admin, can_approve_bookings, can_manage_rates
FROM   public.profiles
WHERE  email = 'your-email@example.com';
```

### 5. Configure Supabase Auth URLs

**Authentication → URL Configuration:**
| Field | Value (local dev) | Value (production) |
|---|---|---|
| Site URL | `http://localhost:3000` | `https://your-hoa-domain.com` |
| Redirect URLs | `http://localhost:3000/login` | `https://your-hoa-domain.com/login` + `https://<vercel-project>.vercel.app/login` |

### 6. Environment variables

Copy `.env.example` → `.env.local` and fill in:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://maszzkhdylmgprnpneqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role (SERVER-SIDE ONLY — NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (used in password reset emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run locally

```bash
npm run dev     # http://localhost:3000
npm run lint    # ESLint (next/core-web-vitals)
npm run build   # Production build
npm run start   # Serve production build
```

- Open [http://localhost:3000](http://localhost:3000) → public calendar + booking form
- Open [http://localhost:3000/login](http://localhost:3000/login) → sign in with the super admin you created
- `/super-admin/` unlocks the full management dashboard
- `/admin/` is for regular admins (and admins with delegated permissions; super-admins are redirected automatically to `/super-admin/`)

---

## 🛡️ User Roles & Capabilities Matrix

| Feature | Public | User | Admin | Admin + Flags | Super Admin |
|---|---|---|---|---|---|
| View calendar / availability | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit booking via public form | ✅ | — | — | — | — |
| Log into dashboard | — | ❌* | ✅ | ✅ | ✅ |
| Create bookings on calendar | — | — | ✅ | ✅ | ✅ |
| View own bookings / cancel | — | — | ✅ | ✅ | ✅ |
| **Approve / Reject bookings** | — | — | ❌ | `can_approve_bookings` ✅ | ✅ |
| **Create / edit users & admins** | — | — | ❌ | `can_create_admin` ✅ | ✅ |
| **Update court rate ($/hr)** | — | — | ❌ | `can_manage_rates` ✅ | ✅ |
| **Grant permission flags** | — | — | ❌ | `can_grant_admin_permissions` ✅ | ✅ |
| View full analytics dashboard | — | — | ❌ | ❌ | ✅ |
| Export bookings to Excel | — | — | ❌ | ❌ | ✅ |

> \* The `user` role exists in the enum and can be created by an admin, but has no dashboard routes today. It's reserved for future self-service resident logins.

### Operating Hours & Pricing Enforced by Code
- **Booking window:** `06:00` – `22:00` daily (enforced in Zod schemas + pricing calculator)
- **Min duration:** 1 hour (`booking_time_step_hours = 1`)
- **Max duration:** 16 hours (whole day — check open-to-close window)
- **Price:** From `system_settings.price_per_hour` × computed hours (saved as `price_per_hour` + `total_price` columns per booking, historical records preserved via `price_history` snapshot on every change)
- **Booking number format:** `RR-YYYYMMDD-NNN` (auto-generated; DB-level generator function as fallback)
- **Timezone:** All dates normalized to `Asia/Manila` (UTC+8)

---

## 📂 Project Structure

```
rimreserve/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root app shell: providers, metadata, loading screen
│   │   ├── page.tsx                # Public landing: calendar + booking form
│   │   ├── robots.ts               # SEO / sitemap
│   │   ├── site.ts                 # Site config
│   │   ├── sitemap.ts              # Sitemap generator
│   │   ├── login/                  # Email + password auth page
│   │   ├── forgot-password/        # Supabase magic link reset flow
│   │   ├── admin/                  # Admin area (role=admin + delegated-flag users)
│   │   │   ├── layout.tsx          # Access gate, sidebar shell
│   │   │   ├── page.tsx            # Admin overview calendar
│   │   │   ├── bookings/           # Admin booking list + create
│   │   │   ├── calendar/           # Admin calendar view
│   │   │   ├── users/              # Admin user mgmt (if can_create_admin)
│   │   │   └── settings/           # Court pricing (if can_manage_rates)
│   │   ├── super-admin/            # Super admin area (role=super_admin)
│   │   │   ├── layout.tsx          # Access gate (OR any delegated permission)
│   │   │   ├── page.tsx            # Analytics dashboard w/ Recharts + KPI cards
│   │   │   ├── bookings-management/# Full booking CRUD + approval queue + Excel export
│   │   │   ├── users/              # Full user CRUD + password resets
│   │   │   └── settings/           # Pricing with historical rate table
│   │   └── api/                    # App Router route handlers (JSON API, no-Auth)
│   │       ├── bookings/           # CRUD, action (approve/reject), public, export
│   │       ├── users/              # Admin CRUD
│   │       ├── profile/            # Current user profile + patch
│   │       ├── dashboard/stats/    # Aggregate counts + revenue for charts
│   │       └── settings/price/     # Get/update court rate
│   ├── components/
│   │   ├── providers/              # Theme, QueryClient, SiteStatusProvider
│   │   ├── layout/                 # Sidebars, nav, permission-based nav items
│   │   ├── ui/                     # Radix primitives + shadcn-style UI components
│   │   ├── booking/                # Booking form, detail dialog, booking cards
│   │   ├── calendar/               # Calendar view + day schedule + booking dots
│   │   └── dashboard/              # Stats cards + charts + export button
│   ├── lib/
│   │   ├── supabase/               # Client/server/middleware Supabase factories
│   │   ├── auth/                   # Session helpers + permissions guards
│   │   ├── booking/                # Pricing, time overlap, date formatting (Asia/Manila)
│   │   ├── validation/             # Zod schemas for every input
│   │   ├── audit.ts                # Audit logger
│   │   └── utils.ts                # cn() + helpers
│   └── types/index.ts              # Shared interfaces, role/status enums
├── supabase/
│   └── migrations/001_initial_schema.sql  # Full DB: tables, enums, RLS, triggers, defaults
├── public/                         # Favicon, PWA manifest, logos, rim images
├── package.json                    # Node scripts + deps
├── tsconfig.json                   # Strict TS, @/* alias
├── next.config.ts                  # Next config (placeholder — customize as needed)
└── .env.example                    # Environment template
```

---

## 🧾 Booking Workflow (State Machine)

```
   [ Public/Admin submits ]
             │
             ▼
       ┌───────────┐
       │  PENDING  │◄──── Super Admin marks "Un-cancel" (via revert admin action)
       └─────┬─────┘
             │
       ┌─────┴──────┐
       ▼            ▼
┌──────────┐  ┌──────────┐
│ APPROVED │  │ REJECTED │◄─── Admin w/ approval cap reviews request
└────┬─────┘  └──────────┘     with optional reason (stored in notes)
     │
     │  Super-admin / requester cancels
     ▼
┌────────────┐
│ CANCELLED  │
└────────────┘
```

- **Blocked in calendar**: `pending` + `approved`
- **Available**: `rejected` + `cancelled`
- Every status change is automatically recorded to `booking_status_history` (DB trigger) and a row is added to `notifications` for the assignee.

### Conflict Detection (Dual Guarantees)

1. **App-level check** in `POST /api/bookings` and `POST /api/bookings/public`:
   - Queries overlapping bookings for the date and returns `409 Conflict` before ever touching the DB.
2. **DB trigger** `check_booking_conflict()`:
   - Runs at `BEFORE INSERT OR UPDATE` in Postgres and raises exception with `RAISE EXCEPTION 'BOOKING_CONFLICT: ...'` regardless of the app-level check.

Even if a malicious user edits the client bypass or a race condition between two simultaneous requests happens, **the second copy will not slip through**.

---

## 🔌 API Routes Reference

| Method | Endpoint | Role/Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/bookings` | public (anon) | All bookings (optional `?date=YYYY-MM-DD` & `?mine=true`) |
| `POST` | `/api/bookings` | admin | Create booking on behalf of requester |
| `POST` | `/api/bookings/public` | public (anon) | Public walk-in booking |
| `GET` | `/api/bookings/:id` | owner or admin or approver | Booking detail |
| `PATCH` | `/api/bookings/:id` | admin / owner | Update booking details |
| `POST` | `/api/bookings/:id` | `can_approve_bookings` | Approve / Reject / Cancel action (with reason) |
| `GET` | `/api/bookings/export` | super_admin | Excel `.xlsx` download |
| `GET` | `/api/dashboard/stats` | super_admin | Aggregated counts + revenue + top requesters |
| `GET` | `/api/users` | `can_create_admin` | Users list |
| `POST` | `/api/users` | `can_create_admin` | Create admin via service role |
| `PATCH` | `/api/users/:id` | `can_create_admin` | Toggle active, change role, update delegated permissions |
| `POST` | `/api/users/:id` | `can_create_admin` / owner | Trigger password reset email |
| `GET` | `/api/profile` | authenticated | Current user's own profile |
| `GET` | `/api/settings/price` | public | Current price per hour + history |
| `PUT` | `/api/settings/price` | `can_manage_rates` | Update rate (auto snapshots history) |

All mutations validate with Zod, enforce auth + role guards before the service client is used, and log to `audit_logs` on success.

---

## 🔐 Security Notes for Admins

- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — used only in API routes (server-side) for writes that need to act "above RLS" (e.g. creating a user via auth admin API, reading the price history). It is **never** imported into client components.
- RLS policies cover every table; Supabase `anon` and `authenticated` roles are granted per-table privileges only where intended.
- Profiles `email` + permission flags are not exposed by dedicated "public profile" endpoints — but be aware that a permissive RLS read policy currently allows `SELECT *` on `profiles` for authenticated users; tighten this in the SQL migration if you need to hide emails.
- Never commit `.env.local`. `@marsidev/react-turnstile` is already a dependency if you later want CAPTCHA protection on the public booking form (recommended to stop spam).

---

## 🚢 Deployment (Vercel)

1. Push to GitHub.
2. In **Vercel → Import Project** select your repo.
3. Under **Environment Variables** copy all four from `.env.local` and set values for production:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
   ```
4. Click **Deploy**.
5. **Back in Supabase → Authentication → URL Configuration**, add the Vercel domain to Site URL + Redirect URLs.

---

## 📜 License

MIT — Free to use and customize for the HOA.

---

**Rimreserve** · St. Joseph Village 6 Phase 4 · Cabuyao City, Laguna
