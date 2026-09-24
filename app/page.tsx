import { FileSearch, LockOpen, Upload } from "lucide-react";
import { NetworkMotif } from "@/components/NetworkMotif";
import { ResumeDropzone } from "@/components/ResumeDropzone";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const facts = [
  { value: "1", label: "Free review per person", accent: true },
  { value: "2 clicks", label: "Upload, then sign in with Google" },
];

const steps = [
  {
    icon: Upload,
    title: "Upload your resume",
    body: "Drop in a PDF or DOCX. No account needed to get started.",
  },
  {
    icon: FileSearch,
    title: "See your score",
    body: "We check structure, length, contact details, and the formatting that trips up applicant tracking systems.",
  },
  {
    icon: LockOpen,
    title: "Unlock your fixes",
    body: "Sign in with Google to get line-by-line rewrites, ranked by what to fix first.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="container hero-wrap">
          <section className="hero" aria-labelledby="hero-title">
            <NetworkMotif className="hero-network" />
            <div className="hero-copy">
              <p className="hero-eyebrow rise">Free resume review</p>
              <h1 id="hero-title" className="hero-title rise rise-2">
                See what to fix <em>first</em>
              </h1>
              <p className="hero-lead rise rise-3">
                Upload your resume and get specific rewrites for your weakest lines,
                not generic tips.
              </p>
              <dl className="hero-facts rise rise-4">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="visually-hidden">{f.label}</dt>
                    <dd style={{ margin: 0 }}>
                      <div className={`hero-fact-value${f.accent ? " is-accent" : ""}`}>{f.value}</div>
                      <div className="hero-fact-label">{f.label}</div>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="hero-card-slot rise rise-2">
              <ResumeDropzone />
            </div>
          </section>
        </div>

        <section className="section" aria-labelledby="how-title">
          <div className="container">
            <div className="section-head">
              <p className="tm-eyebrow">How it works</p>
              <h2 id="how-title" className="section-title">
                Three steps, about a minute
              </h2>
            </div>
            <ol className="steps">
              {steps.map((s, i) => (
                <li key={s.title} className="tm-card">
                  <div className="step-head">
                    <span className="step-number">{String(i + 1).padStart(2, "0")}</span>
                    <span className="step-icon">
                      <s.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-body">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
