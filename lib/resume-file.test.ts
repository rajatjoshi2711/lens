import { describe, expect, it } from "vitest";
import { checkResumeFile, MAX_RESUME_BYTES } from "./resume-file";

describe("checkResumeFile", () => {
  it("accepts a PDF under 4 MB", () => {
    expect(checkResumeFile({ name: "cv.pdf", type: "application/pdf", size: 1000 })).toBeNull();
  });

  it("accepts a DOCX by extension when the browser gives no type", () => {
    expect(checkResumeFile({ name: "cv.DOCX", type: "", size: 1000 })).toBeNull();
  });

  it("rejects other formats", () => {
    expect(checkResumeFile({ name: "cv.png", type: "image/png", size: 1000 })).toMatch(/PDF or DOCX/);
  });

  it("rejects files over 4 MB", () => {
    expect(
      checkResumeFile({ name: "cv.pdf", type: "application/pdf", size: MAX_RESUME_BYTES + 1 }),
    ).toMatch(/over 4 MB/);
  });

  it("rejects empty files", () => {
    expect(checkResumeFile({ name: "cv.pdf", type: "application/pdf", size: 0 })).toMatch(/empty/);
  });
});
