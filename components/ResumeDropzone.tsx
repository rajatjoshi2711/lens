"use client";

import { CircleAlert, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ACCEPT_ATTRIBUTE, checkResumeFile, MAX_RESUME_MB } from "@/lib/resume-file";

/**
 * Resume picker with drag and drop. Phase 2 posts the file to /api/upload.
 */
export function ResumeDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function pick(f: File | undefined) {
    if (!f) return;
    const problem = checkResumeFile(f);
    setError(problem);
    setFile(problem ? null : f);
  }

  return (
    <form
      className="tm-card upload-card"
      aria-labelledby="upload-title"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <h2 id="upload-title" className="upload-card-title">
        Upload your resume
      </h2>

      <div
        className="dropzone"
        role="button"
        tabIndex={0}
        data-dragging={dragging}
        data-has-file={!!file}
        aria-label={file ? `Selected ${file.name}. Choose a different file` : "Choose a resume file"}
        aria-describedby="dropzone-limit"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
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
          pick(e.dataTransfer.files[0]);
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
        />
        <span className="tm-field-hint">Optional. Helps us tailor the advice.</span>
      </div>

      <button
        type="submit"
        className="tm-btn tm-btn-primary tm-btn-lg tm-btn-block is-elevated"
        disabled={!file}
      >
        Review my resume
      </button>
      <p className="consent">
        By uploading, you agree Talent Muscle stores your resume. Read the{" "}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </form>
  );
}
