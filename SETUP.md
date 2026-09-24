# External setup

Everything the app needs outside this repo. Fill values into `.env.local` (copy from `.env.example`).

## 1. Supabase (database and auth)

1. Create a free project at https://supabase.com. Pick the region closest to your candidates (for India: Mumbai, `ap-south-1`).
2. **Project Settings > API Keys**: copy the project URL, the publishable key, and the secret key into `.env.local`.
3. **SQL Editor**: paste and run `supabase/migrations/0001_init.sql`.
   (Or with the Supabase CLI: `supabase link` then `supabase db push`.)
4. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000` for now, your production URL later.
   - Redirect URLs: add `http://localhost:3000/**` and `https://<your-domain>/**`.
5. **Authentication > Sign In / Providers > Email**: keep email enabled (used for admins), turn **off** "Allow new users to sign up" so only invited admins can get email accounts. Candidates use Google.

## 2. Google sign-in (candidates)

1. Google Cloud Console > APIs & Services > **OAuth consent screen**: app name "Talent Muscle", support email, scopes `email`, `profile`, `openid`. Publish the app (Testing mode limits you to 100 test accounts).
2. **Credentials > Create credentials > OAuth client ID**, type *Web application*.
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (shown in Supabase under the Google provider).
3. Supabase > **Authentication > Sign In / Providers > Google**: enable, paste the client ID and secret.

## 3. Email for admin invites and password resets (SMTP)

Supabase's built-in mailer only sends to your Supabase team members, so admin emails need custom SMTP.

1. Create a free account at https://resend.com (3,000 emails/month) or https://brevo.com (300/day).
2. Verify the `talentmuscle.com` domain (add the DNS records they give you).
3. Create an SMTP credential / API key.
4. Supabase > **Authentication > Emails > SMTP Settings**: enable custom SMTP, sender `no-reply@talentmuscle.com`, paste host, port, username, password.

## 4. SharePoint via Microsoft Graph (resume storage)

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

## 5. Cloudflare Turnstile (bot protection)

1. https://dash.cloudflare.com > **Turnstile > Add widget**, mode *Invisible* (or *Managed*).
2. Hostnames: `localhost` and your production domain.
3. Copy the site key and secret key.

## 6. Groq (AI)

1. https://console.groq.com > **API Keys > Create**.
2. Check the current model list at https://console.groq.com/docs/models and adjust `GROQ_MODEL` if the default has changed.

## 7. First admin

Runs in Phase 5, after steps 1 and 3 are done. The seed script emails a set-your-password link to `rajat@talentmuscle.com`.
