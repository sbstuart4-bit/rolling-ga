import { describe, expect, it } from "vitest";
import { composePilotMailto, validatePilotInquiry } from "@/lib/marketing-pilot";

describe("pilot inquiry validation", () => {
  it("accepts a complete inquiry", () => {
    const result = validatePilotInquiry({
      name: "Jordan Hale",
      email: "jordan@example.com",
      role: "Artist manager",
      organization: "The Degens",
      notes: "Five-show Midwest run",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organization).toBe("The Degens");
    }
  });

  it("rejects missing required fields", () => {
    const result = validatePilotInquiry({
      name: "",
      email: "not-an-email",
      role: "",
      organization: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.role).toBeDefined();
      expect(result.fieldErrors.organization).toBeDefined();
    }
  });

  it("composes a mailto without inventing a CRM payload", () => {
    const href = composePilotMailto("pilots@example.com", {
      name: "Jordan Hale",
      email: "jordan@example.com",
      role: "Artist manager",
      organization: "The Degens",
    });

    expect(href.startsWith("mailto:pilots@example.com?")).toBe(true);
    expect(href).toContain(encodeURIComponent("Rolling GA pilot — The Degens"));
    expect(href).toContain(encodeURIComponent("jordan@example.com"));
  });
});
