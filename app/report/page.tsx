import { FileSearch, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScoreRing } from "@/components/ScoreRing";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSessionUser } from "@/lib/session";
import { latestUploadForUser } from "@/lib/uploads";

export const metadata: Metadata = {
  title: "Your report | Lens by Talent Muscle",
  robots: { index: false },
};

export default async function ReportPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  const upload = await latestUploadForUser(user.id);
  const firstName = user.name.split(" ")[0] || "there";

  return (
    <>
      <SiteHeader />
      <main className="container teaser">
        <div className="report-head rise">
          <p className="tm-eyebrow">Your report</p>
          <h1 className="teaser-title">Hi {firstName}</h1>
          <p className="section-lead">Signed in as {user.email}</p>
        </div>

        {!upload ? (
          <section className="tm-card teaser-unreadable rise rise-2" aria-labelledby="no-upload-title">
            <span className="step-icon">
              <FileSearch size={20} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <h2 id="no-upload-title" className="teaser-section-title">
              No resume linked to this account yet
            </h2>
            <p className="section-lead">
              Upload your resume and we&apos;ll link it to {user.email} for your free report.
            </p>
            <Link href="/" className="tm-btn tm-btn-primary tm-btn-lg">
              Upload a resume
            </Link>
          </section>
        ) : (
          <div className="teaser-grid">
            <section className="tm-card teaser-score rise rise-2" aria-label="Resume score">
              {upload.teaser ? (
                <ScoreRing score={upload.teaser.score} />
              ) : (
                <span className="step-icon">
                  <FileSearch size={20} strokeWidth={1.5} aria-hidden="true" />
                </span>
              )}
              <div className="teaser-score-copy">
                <p className="tm-eyebrow">Linked resume</p>
                <h2 className="teaser-section-title tm-mono report-file">{upload.original_filename}</h2>
                <p className="teaser-meta">
                  {upload.target_role ? `Aiming for ${upload.target_role}` : "No target role given"}
                </p>
                {!upload.teaser && (
                  <p className="teaser-meta">
                    We couldn&apos;t read the text in this file.{" "}
                    <Link href="/">Upload a text-based PDF or DOCX</Link> to get your report.
                  </p>
                )}
              </div>
            </section>

            <aside className="tm-card unlock-card rise rise-3" aria-labelledby="pending-title">
              <span className="unlock-lock">
                <Sparkles size={20} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h2 id="pending-title" className="teaser-section-title">
                Your recommendations are next
              </h2>
              <p className="section-lead">
                Your resume is saved to your account. Line-by-line recommendations will appear here.
              </p>
              <p className="tm-notice">AI recommendations are not connected yet.</p>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
