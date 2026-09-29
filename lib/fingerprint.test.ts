import { describe, expect, it } from "vitest";
import { normalizeEmail, resumeFingerprint } from "./fingerprint";

describe("resumeFingerprint", () => {
  it("ignores case, punctuation, and whitespace differences", () => {
    expect(resumeFingerprint("Led a team of 8.\n\nGrew revenue 32%!")).toBe(
      resumeFingerprint("led a team   of 8 grew REVENUE 32"),
    );
  });

  it("differs when the words differ", () => {
    expect(resumeFingerprint("Led a team of 8")).not.toBe(resumeFingerprint("Led a team of 9"));
  });
});

describe("normalizeEmail", () => {
  it("strips gmail dots and plus tags", () => {
    expect(normalizeEmail("Priya.Sharma+jobs@Gmail.com")).toBe("priyasharma@gmail.com");
    expect(normalizeEmail("priya.sharma@googlemail.com")).toBe("priyasharma@gmail.com");
  });

  it("keeps dots for other domains but strips plus tags", () => {
    expect(normalizeEmail("priya.sharma+x@talentmuscle.com")).toBe("priya.sharma@talentmuscle.com");
  });
});
