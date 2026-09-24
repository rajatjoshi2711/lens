import "server-only";
import { randomBytes } from "node:crypto";
import { getAuth } from "@/lib/auth";
import { getPool } from "@/lib/db";

type CreateAdminOptions = {
  email: string;
  name?: string;
  addedBy?: string | null;
  /** Send the set-password email. When false, returns a temporary password. */
  sendInvite: boolean;
};

type CreateAdminResult = { userId: string; temporaryPassword?: string };

/**
 * Creates (or promotes) an admin. Public sign-up is disabled, so the auth
 * user and credential account are created through Better Auth's internal
 * adapter, then the admin sets their own password via the reset flow.
 */
export async function createAdmin({
  email,
  name,
  addedBy = null,
  sendInvite,
}: CreateAdminOptions): Promise<CreateAdminResult> {
  const auth = getAuth();
  const ctx = await auth.$context;
  const normalized = email.trim().toLowerCase();

  // Unguessable placeholder when inviting; a printable one-time password otherwise.
  const password = randomBytes(sendInvite ? 32 : 12).toString("base64url");
  const hash = await ctx.password.hash(password);

  const existing = await ctx.internalAdapter.findUserByEmail(normalized, { includeAccounts: true });
  let userId: string;

  if (existing) {
    userId = existing.user.id;
    const credential = existing.accounts.find((a) => a.providerId === "credential");
    if (credential) {
      await ctx.internalAdapter.updatePassword(userId, hash);
    } else {
      await ctx.internalAdapter.linkAccount({
        userId,
        providerId: "credential",
        accountId: userId,
        password: hash,
      });
    }
  } else {
    const user = await ctx.internalAdapter.createUser({
      email: normalized,
      name: name ?? normalized.split("@")[0],
      emailVerified: true,
    }, { method: "admin" });
    userId = user.id;
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: "credential",
      accountId: userId,
      password: hash,
    });
  }

  await getPool().query(
    `insert into admins (user_id, email, added_by, is_active, must_change_password)
     values ($1, $2, $3, true, $4)
     on conflict (user_id) do update
       set is_active = true, must_change_password = excluded.must_change_password`,
    [userId, normalized, addedBy, !sendInvite],
  );

  if (sendInvite) {
    const siteUrl = process.env.BETTER_AUTH_URL!;
    await auth.api.requestPasswordReset({
      body: { email: normalized, redirectTo: `${siteUrl}/admin/reset-password` },
    });
    return { userId };
  }
  return { userId, temporaryPassword: password };
}
