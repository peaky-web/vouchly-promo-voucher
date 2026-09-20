# Vouchly — Promo Voucher React Demo

A modern React + Vite school demonstration website for restaurant promotional vouchers.

## Stack

- React
- Vite
- Supabase
- Vercel
- CSS animations
- Lucide React icons

## 1. Install Node.js

Install Node.js LTS if it is not already installed.

Check in VS Code terminal:

```bash
node -v
npm -v
```

## 2. Install project dependencies

Open this folder in Visual Studio Code, then run:

```bash
npm install
```

## 3. Run locally

```bash
npm run dev
```

Vite will show a local address, normally:

```text
http://localhost:5173/
```

## 4. Connect Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Copy everything from `supabase/schema.sql`.
4. Run the SQL.
5. Go to your Supabase project settings and get the Project URL and anon/publishable key.
6. Copy `.env.example` to `.env`.
7. Put your values into `.env`:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-KEY
```

Restart the Vite dev server after changing `.env`.

## 5. Demo behavior

If Supabase is not configured, the site still opens and displays the voucher UI using sample data. The local demo can be used for visual development.

Once Supabase is configured, signup, login, vouchers, and claims use Supabase.

## 6. GitHub + Vercel

Push the project to GitHub.

In Vercel:

1. Add New Project.
2. Import the GitHub repository.
3. Vercel should detect Vite automatically.
4. Add the same environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

## IMPORTANT SCHOOL-DEMO SECURITY NOTE

This project intentionally demonstrates a plaintext password field/database column because that was requested for a classroom demonstration.

Do NOT use a real password and do NOT reuse a personal password.

For a real production website, passwords should never be stored in plaintext. Use Supabase Auth or another proper authentication system with secure password handling.

The restaurant names and offers in this starter are sample/demo content and should not be represented as official restaurant promotions without permission.
