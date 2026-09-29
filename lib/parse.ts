import "server-only";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export type ResumeKind = "pdf" | "docx";

export type ParsedResume = {
  kind: ResumeKind;
  text: string;
  pages: number | null;
  /** DOCX only: layout elements that often break applicant tracking systems. */
  tables: number;
  images: number;
};

/** Below this many characters we treat the file as unreadable (likely scanned). */
export const MIN_TEXT_CHARS = 200;

/** Identify the real file type from its first bytes, ignoring the name. */
export function sniffResumeKind(bytes: Uint8Array): ResumeKind | null {
  // "%PDF-"
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
    return "pdf";
  }
  // ZIP local file header "PK\x03\x04". DOCX is a ZIP; mammoth confirms the rest.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "docx";
  }
  return null;
}

export const MIME_BY_KIND: Record<ResumeKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export class UnsupportedFileError extends Error {}

function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function parseResume(bytes: Uint8Array): Promise<ParsedResume> {
  const kind = sniffResumeKind(bytes);
  if (!kind) throw new UnsupportedFileError("Upload a PDF or DOCX file.");

  if (kind === "pdf") {
    try {
      // unpdf may detach the buffer it is given, so hand it a copy.
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const { totalPages, text } = await extractText(pdf, { mergePages: false });
      return { kind, text: tidy(text.join("\n\n")), pages: totalPages, tables: 0, images: 0 };
    } catch {
      throw new UnsupportedFileError("We couldn't open this PDF. It may be damaged or password protected.");
    }
  }

  try {
    const buffer = Buffer.from(bytes);
    const [{ value: text }, { value: html }] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ]);
    return {
      kind,
      text: tidy(text),
      pages: null,
      tables: (html.match(/<table/g) ?? []).length,
      images: (html.match(/<img/g) ?? []).length,
    };
  } catch {
    throw new UnsupportedFileError("We couldn't open this file. Save it as a PDF or DOCX and try again.");
  }
}
