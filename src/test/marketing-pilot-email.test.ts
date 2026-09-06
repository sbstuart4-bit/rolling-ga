import { describe, expect, it } from "vitest";
import {
  buildPilotInquiryEmail,
  buildPilotInquiryIdempotencyKey,
  buildPilotInquiryHtml,
  buildPilotInquiryPlainText,
  buildPilotInquirySubject,
  escapePilotEmailHtml,
} from "@/lib/marketing-pilot-email";
import type { PilotInquiry } from "@/lib/marketing-pilot";

const sampleInquiry: PilotInquiry = {
  name: "Jordan Hale",
  email: "jordan@example.com",
  organization: "The Degens",
  roleTitle: "Tour manager",
  partnerType: "Artist / Manager",
  hasShowInMind: "yes",
  opportunity: "Midwest club run",
  message: "Interested in a single-show pilot",
};

describe("pilot inquiry email content", () => {
  it("builds a clear subject for a new pilot inquiry", () => {
    expect(buildPilotInquirySubject(sampleInquiry)).toBe(
      "New Rolling GA pilot inquiry — Midwest club run",
    );
  });

  it("includes all submitted fields in plain text", () => {
    const text = buildPilotInquiryPlainText(sampleInquiry);

    expect(text).toContain("Name: Jordan Hale");
    expect(text).toContain("Work email: jordan@example.com");
    expect(text).toContain("Organization: The Degens");
    expect(text).toContain("Role: Tour manager");
    expect(text).toContain("I am a: Artist / Manager");
    expect(text).toContain("Show in mind: Yes");
    expect(text).toContain("Show / artist / opportunity: Midwest club run");
    expect(text).toContain("Interested in a single-show pilot");
  });

  it("escapes user-supplied HTML", () => {
    const html = buildPilotInquiryHtml({
      ...sampleInquiry,
      name: `<script>alert("x")</script>`,
      message: `Line 1\n<script>bad</script>`,
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });

  it("uses the visitor email as reply-to", () => {
    const email = buildPilotInquiryEmail(sampleInquiry);
    expect(email.replyTo).toBe("jordan@example.com");
  });

  it("builds a stable idempotency key for identical inquiries", () => {
    const first = buildPilotInquiryIdempotencyKey(sampleInquiry);
    const second = buildPilotInquiryIdempotencyKey({ ...sampleInquiry });
    expect(first).toBe(second);
  });

  it("escapes HTML entities for email rendering", () => {
    expect(escapePilotEmailHtml(`Tom & Jerry's "show"`)).toBe(
      "Tom &amp; Jerry&#39;s &quot;show&quot;",
    );
  });
});
