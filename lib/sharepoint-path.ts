/** Characters SharePoint rejects in file names. */
const ILLEGAL = /["*:<>?/\\|#%~&{}\u0000-\u001f]/g;

export function sanitizeFileName(name: string, fallbackExt: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .replace(ILLEGAL, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.]+|[\s.]+$/g, "")
    .slice(0, 80);
  return `${base || "resume"}.${fallbackExt}`;
}

/** Resumes/YYYY/MM/<uploadId>_<name>.<ext>, dated in UTC. */
export function sharepointPath(opts: {
  root: string;
  uploadId: string;
  originalName: string;
  ext: string;
  date: Date;
}): string {
  const yyyy = String(opts.date.getUTCFullYear());
  const mm = String(opts.date.getUTCMonth() + 1).padStart(2, "0");
  const root = opts.root.replace(/^\/+|\/+$/g, "");
  return `${root}/${yyyy}/${mm}/${opts.uploadId}_${sanitizeFileName(opts.originalName, opts.ext)}`;
}
