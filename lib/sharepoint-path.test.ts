import { describe, expect, it } from "vitest";
import { sanitizeFileName, sharepointPath } from "./sharepoint-path";

describe("sharepointPath", () => {
  it("builds a dated path prefixed with the upload id", () => {
    expect(
      sharepointPath({
        root: "/Resumes/",
        uploadId: "abc-123",
        originalName: "Priya Sharma CV.pdf",
        ext: "pdf",
        date: new Date("2026-03-05T23:30:00Z"),
      }),
    ).toBe("Resumes/2026/03/abc-123_Priya Sharma CV.pdf");
  });
});

describe("sanitizeFileName", () => {
  it("removes characters SharePoint rejects", () => {
    expect(sanitizeFileName('my:cv*"final"?#1.pdf', "pdf")).toBe("my cv final 1.pdf");
  });

  it("uses the sniffed extension, not the given one", () => {
    expect(sanitizeFileName("resume.exe", "docx")).toBe("resume.docx");
  });

  it("falls back to 'resume' when nothing is left", () => {
    expect(sanitizeFileName("???.pdf", "pdf")).toBe("resume.pdf");
    expect(sanitizeFileName("", "pdf")).toBe("resume.pdf");
  });

  it("caps very long names", () => {
    expect(sanitizeFileName("a".repeat(300) + ".pdf", "pdf").length).toBe(84);
  });
});
