"use client";

import { FileText, Upload } from "lucide-react";
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
      className="ef-card upload-card"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div
        className="dropzone"
        role="button"
        tabIndex={0}
        data-dragging={dragging}
        aria-label="Choose a resume file"
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
          <Upload size={24} strokeWidth={1.5} />
        </span>
        {file ? (
          <span className="dropzone-file">
            <FileText size={20} strokeWidth={1.5} />
            {file.name}
          </span>
        ) : (
          <>
            <p className="ef-subhead">Drop your resume here</p>
            <p className="ef-small" style={{ color: "var(--text-secondary)" }}>
              PDF or DOCX, up to {MAX_RESUME_MB} MB. Or click to browse.
            </p>
          </>
        )}
        {error && (
          <p className="dropzone-error" role="alert">
            {error}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      <div className="field">
        <label htmlFor="target-role">Target role (optional)</label>
        <input
          id="target-role"
          name="targetRole"
          type="text"
          placeholder="For example, product manager"
          maxLength={120}
        />
      </div>

      <button type="submit" className="ef-btn ef-btn-primary btn-block" disabled={!file}>
        Review my resume
      </button>
      <p className="consent">
        By uploading, you agree Talent Muscle stores your resume. See our{" "}
        <a href="/privacy">privacy notice</a>.
      </p>
    </form>
  );
}
