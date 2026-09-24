# External setup

Everything Lens needs outside this repo. Values go into Vercel (**Settings > Environment Variables**) and, for local development, `.env.local` (copy from `.env.example`, or run `npx vercel env pull .env.local`).

Generate random secrets (`BETTER_AUTH_SECRET`, `IP_HASH_SALT`) with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 1. Vercel project

1. https://vercel.com > **Add New > Project** > import `rajatjoshi2711/lens`. Keep the Next.js defaults and deploy.
2. **Settings > Functions > Function Region**: match your Neon region (Mumbai `bom1` or Singapore `sin1`).
3. Note: the Hobby plan is for non-commercial use. Move to Pro before launch.

## 2. Neon Postgres (database)

1. In the Vercel project: **Storage > Create Database > Neon (Serverless Postgres)**. Accept the terms and create or link a Neon account.
2. Region: Mumbai (`aws-ap-south-1`) if offered, otherwise Singapore (`aws-ap-southeast-1`). Plan: Free to start. Name: `lens`.
3. Connect it to the `lens` project for Production, Preview, and Development. Enable **database branch per Preview deployment** so previews never touch production data.
4. Vercel adds `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and related variables automatically.
5. Locally, link the folder and pull the variables:
   ```bash
   npx vercel link
   npx vercel env pull .env.local
   ```
6. Create the tables:
   ```bash
   npm run db:migrate
   ```
   (Alternative: paste `db/migrations/0001_init.sql` into the Neon console **SQL Editor** and run it.)

Free plan notes: compute pauses after about 5 minutes idle, and the first request after that takes roughly half a second longer. Storage is limited, but only resume text lives in the database; files go to SharePoint.

## 3. Better Auth (login)

1. Set `BETTER_AUTH_SECRET` to a random value (command above).
2. Set `BETTER_AUTH_URL` to the site's public URL: `https://lens.talentmuscle.com` (or your `*.vercel.app` URL) in Production, `http://localhost:3000` locally.

## 4. Google sign-in (candidates)

1. Google Cloud Console > APIs & Services > **OAuth consent screen**: app name "Lens", support email, scopes `email`, `profile`, `openid`. Publish the app (Testing mode limits you to 100 test accounts).
2. **Credentials > Create credentials > OAuth client ID**, type *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000`, `https://<your-domain>`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`, `https://<your-domain>/api/auth/callback/google`
3. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## 5. Resend (admin invites and password resets)

1. Create a free account at https://resend.com (3,000 emails/month).
2. **Domains > Add domain** `talentmuscle.com` and add the DNS records it shows.
3. **API Keys > Create**. Put it in `RESEND_API_KEY`. `EMAIL_FROM` defaults to `Lens <no-reply@talentmuscle.com>`.

## 6. SharePoint via Microsoft Graph (resume storage)

Needs a Microsoft 365 admin for the Talent Muscle tenant.

1. Create (or pick) a SharePoint site, for example `Talent Muscle Resumes`, and a document library folder named `Resumes`.
2. Azure portal > **Microsoft Entra ID > App registrations > New registration**, name `Lens`, single tenant.
3. Copy the **Directory (tenant) ID** and **Application (client) ID**.
4. **Certificates & secrets > New client secret**. Copy the value (shown once). Note the expiry date and set a reminder to rotate it.
5. **API permissions > Add > Microsoft Graph > Application permissions > `Sites.Selected`**, then **Grant admin consent**.
6. Grant the app write access to only that site. In Graph Explorer (signed in as an admin), first get the site id:
   `GET https://graph.microsoft.com/v1.0/sites/<tenant>.sharepoint.com:/sites/<site-name>`
   Copy `id` into `SHAREPOINT_SITE_ID`. Then:
   ```
   POST https://graph.microsoft.com/v1.0/sites/<site-id>/permissions
   {
     "roles": ["write"],
     "grantedToIdentities": [{ "application": { "id": "<client-id>", "displayName": "Lens" } }]
   }
   ```

## 7. Cloudflare Turnstile (bot protection)

1. https://dash.cloudflare.com > **Turnstile > Add widget**, mode *Invisible* (or *Managed*).
2. Hostnames: `localhost` and your production domain.
3. Copy the site key and secret key.

## 8. Groq (AI)

1. https://console.groq.com > **API Keys > Create**.
2. Check the current model list at https://console.groq.com/docs/models and adjust `GROQ_MODEL` if the default has changed.

## 9. First admin

After steps 2, 3 and 5:

```bash
npm run seed:admin -- rajat@talentmuscle.com "Rajat"
```

This emails a set-your-password link (valid 24 hours) to that address. If `RESEND_API_KEY` is not set yet, it prints a one-time temporary password in your terminal instead, and the account is flagged to change it on first sign-in.
