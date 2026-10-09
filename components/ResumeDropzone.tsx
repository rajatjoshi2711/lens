"use client";

import { CircleAlert, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ACCEPT_ATTRIBUTE, checkResumeFile, MAX_RESUME_MB } from "@/lib/resume-file";
import { type TurnstileHandle, TurnstileWidget } from "./TurnstileWidget";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Resume picker with drag and drop. Posts to /api/upload, then shows the
 * teaser score. Turnstile renders only when a site key is configured.
 */
export function ResumeDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const turnstile = useRef<TurnstileHandle>(null);
  const [botToken, setBotToken] = useState<string | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const onBotError = useCallback((m: string | null) => setBotError(m), []);

  function pick(f: File | undefined) {
    if (!f) return;
    const problem = checkResumeFile(f);
    setError(problem);
    setFile(problem ? null : f);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || submitting) return;
    const data = new FormData(e.currentTarget);
    data.set("file", file);
    if (TURNSTILE_SITE_KEY) {
      if (!botToken) {
        setError(botError ?? "Still checking your browser. Try again in a moment.");
        return;
      }
      data.set("cf-turnstile-response", botToken);
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Something went wrong on our side. Try again in a minute.");
        // Turnstile tokens are single use; get a fresh one for the retry.
        turnstile.current?.reset();
        setSubmitting(false);
        return;
      }
      router.push("/teaser");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className="tm-card upload-card" aria-labelledby="upload-title" onSubmit={submit}>
      <h2 id="upload-title" className="upload-card-title">
        Upload your resume
      </h2>

      <div
        className="dropzone"
        role="button"
        tabIndex={0}
        data-dragging={dragging}
        data-has-file={!!file}
        aria-disabled={submitting}
        aria-label={file ? `Selected ${file.name}. Choose a different file` : "Choose a resume file"}
        aria-describedby="dropzone-limit"
        onClick={() => !submitting && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!submitting && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!submitting) pick(e.dataTransfer.files[0]);
        }}
      >
        <span className="dropzone-icon">
          {file ? <FileText size={20} strokeWidth={1.5} /> : <Upload size={20} strokeWidth={1.5} />}
        </span>
        {file ? (
          <>
            <span className="dropzone-file">{file.name}</span>
            <span className="dropzone-hint">Click to choose a different file</span>
          </>
        ) : (
          <>
            <span className="dropzone-title">Drop your resume here, or click to browse</span>
            <span id="dropzone-limit" className="dropzone-hint">
              <strong>PDF or DOCX</strong>, up to <strong>{MAX_RESUME_MB} MB</strong>
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      {error && (
        <p className="dropzone-error" role="alert">
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="tm-field">
        <label htmlFor="target-role">Role you are aiming for</label>
        <input
          id="target-role"
          name="targetRole"
          type="text"
          className="tm-input"
          placeholder="For example, product manager"
          maxLength={120}
          disabled={submitting}
        />
        <span className="tm-field-hint">Optional. Helps us tailor the advice.</span>
      </div>

      {TURNSTILE_SITE_KEY && (
        <TurnstileWidget ref={turnstile} siteKey={TURNSTILE_SITE_KEY} onToken={setBotToken} onError={onBotError} />
      )}
      {botError && !error && (
        <p className="dropzone-error" role="alert">
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
          {botError}
        </p>
      )}

      <button
        type="submit"
        className={`tm-btn tm-btn-primary tm-btn-lg tm-btn-block is-elevated${submitting ? " is-loading" : ""}`}
        disabled={!file || submitting}
        aria-busy={submitting}
      >
        {submitting && <span className="tm-spinner" aria-hidden="true" />}
        Review my resume
      </button>
      <p className="consent">
        By uploading, you agree Talent Muscle stores your resume. Read the{" "}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </form>
  );
}
