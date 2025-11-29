# admin.kaburlu

# Kaburlu Admin - Starter Login (Next.js + Tailwind)

This is a minimal Next.js starter project containing a beautiful,
responsive login page wired to the provided login API endpoint.

## What you get
- Responsive Tailwind CSS login page (`/`)
- Simple protected dashboard page (`/dashboard`)
- JWT saved to `localStorage` on successful login
- Example `.env.local` and instructions to run locally

## Run locally
1. Extract the zip and `cd` into `admin-dashboard`
2. Install dependencies: `npm install`
3. Create `.env.local` from the example
4. Run dev server: `npm run dev`
5. Open `http://localhost:3000`

## API
The login form posts to the provided endpoint: `https://app.kaburlumedia.com/api/v1/auth/login`.
Set `NEXT_PUBLIC_API_BASE` in `.env.local` if you want to switch between dev/prod.

## Files of interest
- `pages/index.js` - Login page
- `pages/dashboard.js` - Simple protected dashboard
- `utils/auth.js` - Helper auth utilities
- `styles/globals.css` - Tailwind entry

