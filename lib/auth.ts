import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getPool } from "@/lib/db";
import { passwordLinkEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

async function isActiveAdmin(userId: string): Promise<boolean> {
  const { rows } = await getPool().query(
    "select 1 from admins where user_id = $1 and is_active",
    [userId],
  );
  return rows.length > 0;
}

function createAuth() {
  const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env("auth");

  return betterAuth({
    appName: "Lens",
    baseURL: BETTER_AUTH_URL,
    secret: BETTER_AUTH_SECRET,
    database: getPool(),

    // Candidates: Google only.
    socialProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },

    // Admins: email + password. No public sign-up; admins are created by
    // lib/admin-accounts.ts and set their password through a reset link.
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      resetPasswordTokenExpiresIn: 60 * 60 * 24,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        // Silently skip non-admins so the endpoint never reveals who is an admin.
        if (!(await isActiveAdmin(user.id))) return;
        await sendEmail({ to: user.email, ...passwordLinkEmail(user.name, url) });
      },
      onPasswordReset: async ({ user }) => {
        await getPool().query(
          "update admins set must_change_password = false where user_id = $1",
          [user.id],
        );
      },
    },

    // Stored in Postgres so limits hold across serverless instances.
    rateLimit: { enabled: true, storage: "database" },

    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

/** Lazily created so builds and pages without auth work before env is set. */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
