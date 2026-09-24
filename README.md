# Lens

Lens, by Talent Muscle. Candidates upload a resume, see a free teaser score, sign in with Google, and get one AI-generated set of recommendations. Admins (hidden entry: click the logo 8 times) can see every upload and download resumes stored in SharePoint.

**Stack:** Next.js 16 (App Router), Supabase (Postgres, Auth), Microsoft Graph (SharePoint), Groq, Cloudflare Turnstile. UI follows the EmergeFlow design system (`styles/emergeflow.css`).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values, see SETUP.md
npm run dev
```

Open http://localhost:3000. The landing page runs without any keys; features that need a service show a clear error until it is configured.

## Scripts

- `npm run dev` starts the dev server
- `npm test` runs unit tests (Vitest)
- `npm run lint` runs ESLint
- `npm run typecheck` runs the TypeScript compiler

## Layout

- `app/` pages and route handlers
- `components/` UI components
- `lib/` shared logic (`env.ts`, `supabase/`, validation helpers)
- `proxy.ts` Supabase session refresh (Next 16 renamed middleware to proxy)
- `supabase/migrations/` database schema
- `styles/emergeflow.css` design tokens

## Logo

The header shows a text wordmark placeholder. Put the official logo files in `public/logo/` and swap them into `components/Logo.tsx`.
