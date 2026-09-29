import { CircleCheck, CircleX, FileWarning, ListChecks, Lock, PenLine, Target, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ScoreRing } from "@/components/ScoreRing";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CLAIM_COOKIE, hashClaimToken } from "@/lib/request-meta";
import { getSessionUser } from "@/lib/session";
import type { CheckStatus } from "@/lib/teaser";
import { findUploadByClaimHash } from "@/lib/uploads";

export const metadata: Metadata = {
  title: "Your resume score | Lens by Talent Muscle",
  robots: { index: false },
};

const STATUS_ICON: Record<CheckStatus, typeof CircleCheck> = {
  pass: CircleCheck,
  warn: TriangleAlert,
  fail: CircleX,
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: "Looks good",
  warn: "Worth fixing",
  fail: "Needs work",
};

function verdict(score: number): string {
  if (score >= 80) return "Strong foundation. The full report shows how to sharpen it.";
  if (score >= 55) return "A solid start with a few clear fixes.";
  return "Some important gaps. Fixing them will make a big difference.";
}

export default async function TeaserPage({ searchParams }: PageProps<"/teaser">) {
  const [{ signin }, user] = await Promise.all([searchParams, getSessionUser()]);
  const token = (await cookies()).get(CLAIM_COOKIE)?.value;
  // Signed-in candidates whose upload is already linked belong on their report.
  if (!token) redirect(user ? "/report" : "/");
  const upload = await findUploadByClaimHash(hashClaimToken(token));
  if (!upload) redirect(user ? "/report" : "/");
  const signinFailed = signin === "failed";

  const teaser = upload.teaser;
  const order: CheckStatus[] = ["fail", "warn", "pass"];
  const checks = teaser ? [...teaser.checks].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status)) : [];
  const toFix = checks.filter((c) => c.status !== "pass").length;

  return (
    <>
      <SiteHeader />
      <main className="container teaser">
        {!teaser ? (
          <section className="tm-card teaser-unreadable rise" aria-labelledby="unreadable-title">
            <span className="step-icon">
              <FileWarning size={20} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h1 id="unreadable-title" className="teaser-title">
              We couldn&apos;t read the text in this file
            </h1>
            <p className="section-lead">
              {upload.original_filename} looks like a scanned image or a design export. Screening
              software can&apos;t read it either, so this is worth fixing before you apply anywhere.
            </p>
            <ul className="teaser-tips">
              <li>Export from Word or Google Docs with &quot;Save as PDF&quot;, not &quot;Print to image&quot;.</li>
              <li>Check that you can select and copy the text in the file.</li>
              <li>Or upload the original DOCX.</li>
            </ul>
            <Link href="/" className="tm-btn tm-btn-primary tm-btn-lg">
              Upload a different file
            </Link>
          </section>
        ) : (
          <div className="teaser-grid">
            <section className="teaser-main" aria-labelledby="teaser-title">
              <div className="tm-card teaser-score rise">
                <ScoreRing score={teaser.score} />
                <div className="teaser-score-copy">
                  <p className="tm-eyebrow">Your resume score</p>
                  <h1 id="teaser-title" className="teaser-title">
                    {verdict(teaser.score)}
                  </h1>
                  <p className="teaser-meta">
                    <span className="tm-mono">{upload.original_filename}</span>
                    {upload.target_role ? <> · aiming for {upload.target_role}</> : null}
                  </p>
                </div>
              </div>

              {!teaser.looksLikeResume && (
                <p className="teaser-banner rise rise-2" role="note">
                  <TriangleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
                  This doesn&apos;t look like a resume. If it is, make sure your experience and
                  education have clear headings.
                </p>
              )}

              <div className="tm-card rise rise-2">
                <h2 className="teaser-section-title">
                  {toFix === 0 ? `All ${checks.length} basics check out` : `${toFix} of ${checks.length} basics to fix`}
                </h2>
                <ul className="check-list">
                  {checks.map((c) => {
                    const Icon = STATUS_ICON[c.status];
                    return (
                      <li key={c.id} className="check-item" data-status={c.status}>
                        <Icon className="check-icon" size={20} strokeWidth={1.5} aria-hidden="true" />
                        <div>
                          <p className="check-label">
                            {c.label}
                            <span className="visually-hidden">: {STATUS_LABEL[c.status]}</span>
                          </p>
                          <p className="check-detail">{c.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <aside className="tm-card unlock-card rise rise-3" aria-labelledby="unlock-title">
              <span className="unlock-lock">
                <Lock size={20} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h2 id="unlock-title" className="teaser-section-title">
                Your full report is ready to unlock
              </h2>
              <ul className="unlock-list">
                <li>
                  <PenLine size={16} strokeWidth={1.5} aria-hidden="true" />
                  Line-by-line rewrites of your weakest bullet points
                </li>
                <li>
                  <ListChecks size={16} strokeWidth={1.5} aria-hidden="true" />
                  Fixes ranked by what matters most
                </li>
                <li>
                  <Target size={16} strokeWidth={1.5} aria-hidden="true" />
                  {upload.target_role ? `Advice tailored to ${upload.target_role} roles` : "Advice tailored to your target role"}
                </li>
              </ul>
              {signinFailed && (
                <p className="teaser-banner" role="alert">
                  <TriangleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
                  Google sign-in didn&apos;t finish. Try again, and pick the account you want the report sent to.
                </p>
              )}
              {user ? (
                <a href="/claim" className="tm-btn tm-btn-primary tm-btn-lg tm-btn-block is-elevated">
                  See my report
                </a>
              ) : (
                <GoogleSignInButton />
              )}
              <p className="consent">One free report per person. We only use your Google name and email.</p>
              <Link href="/" className="tm-btn tm-btn-link" style={{ alignSelf: "center" }}>
                Upload a different resume
              </Link>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
