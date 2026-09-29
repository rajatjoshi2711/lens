/**
 * Deterministic resume checks shown before sign-in. No AI, no network, so
 * the teaser is instant and free for anonymous visitors.
 */

export type CheckStatus = "pass" | "warn" | "fail";

export type TeaserCheck = {
  id: "contact" | "sections" | "length" | "impact" | "verbs" | "voice" | "layout";
  label: string;
  status: CheckStatus;
  detail: string;
};

export type Teaser = {
  version: 1;
  score: number;
  looksLikeResume: boolean;
  checks: TeaserCheck[];
  stats: { words: number; bullets: number; quantified: number; pages: number | null };
};

export type TeaserInput = {
  text: string;
  pages: number | null;
  tables: number;
  images: number;
};

const WEIGHTS: Record<TeaserCheck["id"], number> = {
  contact: 15,
  sections: 20,
  length: 15,
  impact: 20,
  verbs: 10,
  voice: 5,
  layout: 15,
};

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /^(work |professional |employment )?(experience|history)|^employment|^career history/i,
  education: /^(education|academic|qualifications)/i,
  skills: /^((technical |core |key )?skills|competencies|expertise|tools)/i,
};

const BULLET_RE = /^[•●▪■◦‣·–\-*➢✔✓>]\s*/;
const NUMBER_RE = /\d|%|₹|\$|£|€|\blakhs?\b|\bcrores?\b/i;
const WEAK_START_RE =
  /^(responsible for|worked on|helped|assisted|duties (included|include)|involved in|tasked with|in charge of|handled)\b/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().-]{8,}\d/g;
const LINKEDIN_RE = /linkedin\.com\/in\//i;

/** Phone numbers have 10 to 13 digits; this skips date ranges like "2018 - 2021". */
function hasPhoneNumber(text: string): boolean {
  return (text.match(PHONE_CANDIDATE_RE) ?? []).some((m) => {
    const digits = m.replace(/\D/g, "").length;
    return digits >= 10 && digits <= 13;
  });
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? []).length;
}

/** Bullet lines, or achievement-length lines when the file has no bullet glyphs. */
function achievementLines(all: string[]): string[] {
  const bullets = all.filter((l) => BULLET_RE.test(l)).map((l) => l.replace(BULLET_RE, ""));
  if (bullets.length >= 3) return bullets;
  return all.filter((l) => {
    const w = wordCount(l);
    return w >= 6 && w <= 45 && !EMAIL_RE.test(l);
  });
}

function scoreOf(checks: TeaserCheck[]): number {
  const earned = checks.reduce((sum, c) => {
    const w = WEIGHTS[c.id];
    return sum + (c.status === "pass" ? w : c.status === "warn" ? w / 2 : 0);
  }, 0);
  return Math.round(earned);
}

export function analyzeResume({ text, pages, tables, images }: TeaserInput): Teaser {
  const all = lines(text);
  const words = wordCount(text);
  const checks: TeaserCheck[] = [];

  // Contact details
  const hasEmail = EMAIL_RE.test(text);
  const hasPhone = hasPhoneNumber(text);
  const hasLinkedIn = LINKEDIN_RE.test(text);
  checks.push({
    id: "contact",
    label: "Contact details",
    status: hasEmail && hasPhone ? "pass" : hasEmail || hasPhone ? "warn" : "fail",
    detail:
      hasEmail && hasPhone
        ? hasLinkedIn
          ? "Email, phone, and LinkedIn are easy to find."
          : "Email and phone found. Adding a LinkedIn URL helps recruiters check your background."
        : hasEmail || hasPhone
          ? `Add your ${hasEmail ? "phone number" : "email address"} so recruiters can reach you.`
          : "Add an email address and phone number at the top.",
  });

  // Core sections
  const headings = all.filter((l) => l.length <= 40 && wordCount(l) <= 5);
  const found = Object.entries(SECTION_PATTERNS)
    .filter(([, re]) => headings.some((h) => re.test(h.replace(/[:|]/g, "").trim())))
    .map(([name]) => name);
  const missing = Object.keys(SECTION_PATTERNS).filter((s) => !found.includes(s));
  checks.push({
    id: "sections",
    label: "Standard sections",
    status: missing.length === 0 ? "pass" : missing.length === 1 ? "warn" : "fail",
    detail:
      missing.length === 0
        ? "Experience, education, and skills are clearly labelled."
        : `Add a clearly labelled ${missing.join(" and ")} section so screening software can find it.`,
  });

  // Length
  const tooManyPages = pages !== null && pages > 2;
  const lengthStatus: CheckStatus =
    words >= 300 && words <= 900 && !tooManyPages
      ? "pass"
      : (words >= 150 && words < 300) || (words > 900 && words <= 1300) || (tooManyPages && words <= 1300)
        ? "warn"
        : "fail";
  checks.push({
    id: "length",
    label: "Length",
    status: lengthStatus,
    detail:
      lengthStatus === "pass"
        ? `${words} words${pages ? ` across ${pages} page${pages > 1 ? "s" : ""}` : ""}. A good length to read in one pass.`
        : words < 300
          ? `${words} words. Add more detail on what you achieved in each role.`
          : `${words} words${pages ? ` across ${pages} pages` : ""}. Cut older or less relevant roles to keep it to two pages.`,
  });

  // Quantified impact
  const achievements = achievementLines(all);
  const quantified = achievements.filter((l) => NUMBER_RE.test(l)).length;
  const ratio = achievements.length ? quantified / achievements.length : 0;
  checks.push({
    id: "impact",
    label: "Measurable results",
    status: achievements.length < 3 ? "fail" : ratio >= 0.4 ? "pass" : ratio >= 0.2 ? "warn" : "fail",
    detail:
      achievements.length < 3
        ? "Describe each role in bullet points that say what you achieved."
        : `${quantified} of ${achievements.length} bullet points include a number. ${
            ratio >= 0.4 ? "Recruiters can see your impact." : "Add numbers such as revenue, time saved, or team size."
          }`,
  });

  // Action verbs
  const weak = achievements.filter((l) => WEAK_START_RE.test(l)).length;
  checks.push({
    id: "verbs",
    label: "Strong opening verbs",
    status: achievements.length === 0 ? "warn" : weak / achievements.length <= 0.1 ? "pass" : "warn",
    detail:
      weak === 0
        ? "Bullet points open with what you did, not what you were responsible for."
        : weak / achievements.length <= 0.1
          ? `Most bullet points open with a strong verb. Reword the ${weak} that start with phrases like "responsible for".`
          : `${weak} bullet point${weak > 1 ? "s" : ""} open with phrases like "responsible for". Start with a verb such as "led" or "built".`,
  });

  // First person
  const pronouns = (text.match(/\b(i|me|my|myself)\b/gi) ?? []).length;
  checks.push({
    id: "voice",
    label: "Professional voice",
    status: pronouns <= 3 ? "pass" : "warn",
    detail:
      pronouns <= 3
        ? "Written without first-person pronouns, as recruiters expect."
        : `"I" or "my" appears ${pronouns} times. Drop them and start lines with the verb.`,
  });

  // Layout that trips up applicant tracking systems
  const shortLines = all.filter((l) => wordCount(l) <= 3).length;
  const fragmented = all.length > 40 && shortLines / all.length > 0.55;
  const layoutIssues = [
    tables > 0 ? `${tables} table${tables > 1 ? "s" : ""}` : null,
    images > 0 ? `${images} image${images > 1 ? "s" : ""}` : null,
    fragmented ? "a multi-column layout" : null,
  ].filter(Boolean);
  checks.push({
    id: "layout",
    label: "Screening software friendly",
    status: layoutIssues.length === 0 ? "pass" : "warn",
    detail:
      layoutIssues.length === 0
        ? "Simple layout that applicant tracking systems can read."
        : `We found ${layoutIssues.join(" and ")}. Some applicant tracking systems skip these, so keep key details in plain text.`,
  });

  const looksLikeResume = found.length >= 1 || (hasEmail && words >= 150);

  return {
    version: 1,
    score: scoreOf(checks),
    looksLikeResume,
    checks,
    stats: { words, bullets: achievements.length, quantified, pages },
  };
}
