# Compound Gains · Lift

A mobile-first PWA for tracking the 12-week Galpin-inspired strength program.
Install it to your iPhone home screen and it works like a native app.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + anonymous auth)
- **Vercel** (deployment)
- **Tailwind CSS**

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Enable **Anonymous sign-ins** under Authentication → Settings
4. Copy your Project URL and anon key

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key
```

### 3. Run locally
```bash
npm install
npm run dev
```

### 4. Deploy to Vercel
Push to GitHub, then import the repo in Vercel.
Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.

## Adding to iPhone Home Screen
1. Open the deployed URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

## Program
- 12 weeks · 4 workouts/week · Upper-Lower split
- Based on Dr. Andy Galpin's principles (MAV, RIR, mesocycle periodization)
- Enter your 1RM in Settings and target weights auto-calculate for every exercise
