/**
 * Creates the first Lens admin.
 * Usage: npm run seed:admin -- rajat@talentmuscle.com "Rajat"
 *
 * With RESEND_API_KEY set, emails a set-your-password link (valid 24 hours).
 * Without it, prints a one-time temporary password to this terminal only;
 * the account is flagged to change it on first sign-in.
 */
import { createAdmin } from "@/lib/admin-accounts";
import { hasEnv } from "@/lib/env";

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !email.includes("@")) {
    console.error('Usage: npm run seed:admin -- <email> ["Full name"]');
    process.exit(1);
  }

  const sendInvite = hasEnv("email");
  const result = await createAdmin({ email, name, sendInvite });

  if (sendInvite) {
    console.log(`Admin ready. A set-password link was emailed to ${email}.`);
  } else {
    console.log("RESEND_API_KEY is not set, so no email was sent.");
    console.log(`Admin ready: ${email}`);
    console.log(`Temporary password (shown once, change it after first sign-in): ${result.temporaryPassword}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
