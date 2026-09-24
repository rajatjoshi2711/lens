# Lens

Lens, by Talent Muscle. Candidates upload a resume, see a free teaser score, sign in with Google, and get one AI-generated set of recommendations. Admins (hidden entry: click the logo 8 times) can see every upload and download resumes stored in SharePoint.

**Stack:** Next.js 16 (App Router) on Vercel, Neon Postgres, Better Auth (Google for candidates, email + password for admins), Resend, Microsoft Graph (SharePoint), Groq, Cloudflare Turnstile. UI follows the EmergeFlow design system (`styles/emergeflow.css`).

## Getting started

```bash
npm install
cp .env.example .env.local   # or: npx vercel env pull .env.local
npm run db:migrate
npm run dev
```

Open http://localhost:3000. The landing page runs without any keys; features that need a service show a clear error until it is configured.

## Scripts

- `npm run dev` starts the dev server
- `npm test` runs unit tests (Vitest)
- `npm run lint` runs ESLint
- `npm run typecheck` runs the TypeScript compiler
- `npm run db:migrate` applies `db/migrations/*.sql` to Neon
- `npm run seed:admin -- <email> "Name"` creates an admin and emails a set-password link

## Layout

- `app/` pages and route handlers
- `components/` UI components
- `lib/` shared logic (`env.ts`, `db.ts`, `auth.ts`, `email.ts`, `admin-accounts.ts`, validation helpers)
- `app/api/auth/[...all]/` Better Auth endpoints
- `db/migrations/` database schema
- `scripts/` migration runner and admin seed
- `styles/emergeflow.css` design tokens

## Logo

The header shows a text wordmark placeholder. Put the official logo files in `public/logo/` and swap them into `components/Logo.tsx`.
