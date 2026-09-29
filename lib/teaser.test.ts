import { describe, expect, it } from "vitest";
import { analyzeResume } from "./teaser";

const strong = `Priya Sharma
priya.sharma@example.com | +91 98765 43210 | linkedin.com/in/priyasharma

Summary
Product manager with 6 years building B2B SaaS.

Experience
Senior Product Manager, Acme Corp, 2021 to present
• Led a team of 8 to launch a billing product that grew revenue 32% in one year
• Cut onboarding time from 14 days to 3 by redesigning the setup flow
• Ran 40+ customer interviews to shape the 2023 roadmap
• Built a pricing experiment that lifted conversion 12%
Product Manager, Beta Ltd, 2018 to 2021
• Shipped a mobile app used by 200,000 drivers
• Reduced support tickets 25% with in-app guides
• Partnered with sales to close 3 enterprise deals worth 1.2 crore

Education
MBA, IIM Bangalore, 2018
B.Tech, Computer Science, NIT Trichy, 2014

Skills
Roadmapping, SQL, user research, pricing, A/B testing, Figma
${"Additional detail about projects and outcomes across roles. ".repeat(30)}`;

describe("analyzeResume", () => {
  it("scores a well-formed resume highly", () => {
    const t = analyzeResume({ text: strong, pages: 1, tables: 0, images: 0 });
    expect(t.looksLikeResume).toBe(true);
    expect(t.score).toBeGreaterThanOrEqual(85);
    const byId = Object.fromEntries(t.checks.map((c) => [c.id, c.status]));
    expect(byId).toMatchObject({ contact: "pass", sections: "pass", impact: "pass", verbs: "pass", voice: "pass", layout: "pass" });
  });

  it("flags missing contact details, sections, and numbers", () => {
    const weak = `My resume
I am a hard worker and I love my job.
- Responsible for managing the team and handling reports
- Worked on various projects for the company
- Helped the manager with daily tasks and duties`;
    const t = analyzeResume({ text: weak, pages: 1, tables: 0, images: 0 });
    const byId = Object.fromEntries(t.checks.map((c) => [c.id, c]));
    expect(byId.contact.status).toBe("fail");
    expect(byId.sections.status).toBe("fail");
    expect(byId.impact.status).toBe("fail");
    expect(byId.verbs.status).toBe("warn");
    expect(byId.voice.status).toBe("warn");
    expect(byId.length.status).toBe("fail");
    expect(t.score).toBeLessThan(30);
  });

  it("warns about tables and images in DOCX files", () => {
    const t = analyzeResume({ text: strong, pages: null, tables: 2, images: 1 });
    const layout = t.checks.find((c) => c.id === "layout")!;
    expect(layout.status).toBe("warn");
    expect(layout.detail).toMatch(/2 tables and 1 image/);
  });

  it("does not mistake a date range for a phone number", () => {
    const text = strong.replace("+91 98765 43210", "").replace(/2021 to present/, "2018 - 2021");
    const contact = analyzeResume({ text, pages: 1, tables: 0, images: 0 }).checks.find((c) => c.id === "contact")!;
    expect(contact.status).toBe("warn");
    expect(contact.detail).toMatch(/phone number/);
  });

  it("warns when the PDF runs past two pages", () => {
    const t = analyzeResume({ text: strong, pages: 4, tables: 0, images: 0 });
    expect(t.checks.find((c) => c.id === "length")!.status).toBe("warn");
  });
});
