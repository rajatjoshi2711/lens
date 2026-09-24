import { CircleCheck } from "lucide-react";
import { ResumeDropzone } from "@/components/ResumeDropzone";
import { SiteHeader } from "@/components/SiteHeader";

const points = [
  "Specific rewrites for your weakest bullet points",
  "ATS checks that catch formatting that gets resumes filtered out",
  "Results in under a minute, sign in with Google to unlock",
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="landing">
        <div className="ef-container-marketing landing-grid">
          <section className="landing-copy ef-rise">
            <p className="ef-eyebrow">Free resume review</p>
            <h1 className="landing-title">
              Get your resume <span className="ef-accent">noticed</span>
            </h1>
            <p className="ef-lead">
              Upload your resume and get clear, line-by-line recommendations on
              what to fix first.
            </p>
            <ul className="landing-points">
              {points.map((p) => (
                <li key={p}>
                  <CircleCheck size={20} strokeWidth={1.5} />
                  {p}
                </li>
              ))}
            </ul>
          </section>
          <section className="ef-rise" style={{ animationDelay: "60ms" }}>
            <ResumeDropzone />
          </section>
        </div>
      </main>
      <footer className="site-footer">
        <div className="ef-container-marketing">
          Lens by Talent Muscle, an EmergeFlow company
        </div>
      </footer>
    </>
  );
}
