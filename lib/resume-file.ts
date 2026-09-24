// Vercel functions reject request bodies over 4.5 MB, so stay safely below it.
export const MAX_RESUME_MB = 4;
export const MAX_RESUME_BYTES = MAX_RESUME_MB * 1024 * 1024;

export const ACCEPTED_RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const ACCEPT_ATTRIBUTE = ".pdf,.docx," + Object.keys(ACCEPTED_RESUME_TYPES).join(",");

/** Client-side pre-check. The server re-validates using magic bytes. */
export function checkResumeFile(file: { name: string; type: string; size: number }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const typeOk = file.type in ACCEPTED_RESUME_TYPES || ext === "pdf" || ext === "docx";
  if (!typeOk) return "Upload a PDF or DOCX file.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_RESUME_BYTES) return `This file is over ${MAX_RESUME_MB} MB. Try a smaller export.`;
  return null;
}
