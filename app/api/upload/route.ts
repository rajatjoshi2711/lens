import { after, type NextRequest, NextResponse } from "next/server";
import { resumeFingerprint } from "@/lib/fingerprint";
import { MIME_BY_KIND, MIN_TEXT_CHARS, parseResume, sniffResumeKind, UnsupportedFileError } from "@/lib/parse";
import {
  CLAIM_COOKIE,
  CLAIM_COOKIE_MAX_AGE,
  clientIp,
  hashIp,
  newClaimToken,
} from "@/lib/request-meta";
import { MAX_RESUME_BYTES, MAX_RESUME_MB } from "@/lib/resume-file";
import { analyzeResume } from "@/lib/teaser";
import { turnstileFailure, verifyTurnstile } from "@/lib/turnstile";
import { createUpload, isRateLimited, storeInSharePoint } from "@/lib/uploads";

export const maxDuration = 60;

function fail(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Choose a resume file to upload.");
  }

  const file = form.get("file");
  const targetRole = String(form.get("targetRole") ?? "").trim().slice(0, 120) || null;
  const ip = clientIp(request.headers);

  const check = await verifyTurnstile(String(form.get("cf-turnstile-response") ?? "") || null, ip);
  if (!check.ok) {
    const { status, message } = turnstileFailure(check);
    return fail(status, message);
  }

  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a resume file to upload.");
  if (file.size > MAX_RESUME_BYTES) return fail(413, `This file is over ${MAX_RESUME_MB} MB. Try a smaller export.`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffResumeKind(bytes);
  if (!kind) return fail(415, "Upload a PDF or DOCX file.");

  const ipHash = hashIp(ip);
  if (await isRateLimited(ipHash)) {
    return fail(429, "You've uploaded a lot of files today. Try again tomorrow.");
  }

  // Every upload is kept, including ones we cannot read, so admins can review them.
  let text: string | null = null;
  let teaser = null;
  let readable = false;
  try {
    const parsed = await parseResume(bytes);
    if (parsed.text.length >= MIN_TEXT_CHARS) {
      text = parsed.text;
      teaser = analyzeResume(parsed);
      readable = true;
    }
  } catch (err) {
    if (!(err instanceof UnsupportedFileError)) throw err;
  }

  const claim = newClaimToken();
  const uploadId = await createUpload({
    claimTokenHash: claim.hash,
    originalFilename: file.name || `resume.${kind}`,
    mimeType: MIME_BY_KIND[kind],
    bytes,
    resumeText: text,
    resumeFingerprint: text ? resumeFingerprint(text) : null,
    teaser,
    targetRole,
    ipHash,
  });

  // Copy to SharePoint after responding; the retry job covers failures.
  after(() => storeInSharePoint(uploadId));

  const response = NextResponse.json({ ok: true, readable });
  response.cookies.set(CLAIM_COOKIE, claim.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CLAIM_COOKIE_MAX_AGE,
  });
  return response;
}
