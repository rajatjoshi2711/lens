import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy notice | Lens by Talent Muscle",
};

// Draft copy. Have this reviewed before launch (India DPDP Act 2023).
export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <article className="container">
          <div className="prose">
            <p className="tm-eyebrow">Privacy notice</p>
            <h1>How we handle your resume</h1>
            <p>
              When you upload a resume, Talent Muscle stores the file and the text
              extracted from it. We use it to generate your recommendations, and our
              team may view and download it.
            </p>
            <p>
              If you sign in with Google, we store your name and email address with
              your upload. We never sell your data.
            </p>
            <p>
              You can ask us to delete your resume and account data at any time from
              your report page, or by emailing us.
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
