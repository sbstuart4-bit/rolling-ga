import { describe, expect, it } from "vitest";
import { validatePilotInquiry } from "@/lib/marketing-pilot";

describe("pilot inquiry validation", () => {
  it("accepts a complete inquiry", () => {
    const result = validatePilotInquiry({
      name: "Jordan Hale",
      email: "jordan@example.com",
      organization: "The Degens",
      roleTitle: "Tour manager",
      partnerType: "Artist / Manager",
      hasShowInMind: "yes",
      opportunity: "Midwest club run — March",
      message: "Five-show pilot opportunity",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.organization).toBe("The Degens");
      expect(result.data.partnerType).toBe("Artist / Manager");
    }
  });

  it("rejects missing required fields", () => {
    const result = validatePilotInquiry({
      name: "",
      email: "not-an-email",
      partnerType: "",
      hasShowInMind: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.partnerType).toBeDefined();
      expect(result.fieldErrors.hasShowInMind).toBeDefined();
    }
  });
});
