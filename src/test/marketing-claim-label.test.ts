import { describe, expect, it } from "vitest";
import { CLAIM_KINDS, CLAIM_LABELS } from "@/components/marketing/claim-label";

describe("marketing claim labels", () => {
  it("uses the approved labels and never says predicted LTV", () => {
    expect(CLAIM_LABELS.demo).toBe("Demo example");
    expect(CLAIM_LABELS.illustrative).toBe("Illustrative");
    expect(CLAIM_LABELS.pilot).toBe("Pilot concept");
    expect(CLAIM_LABELS.framing).toBe("Framing example");

    for (const kind of CLAIM_KINDS) {
      expect(CLAIM_LABELS[kind].toLowerCase()).not.toContain("ltv");
      expect(CLAIM_LABELS[kind].toLowerCase()).not.toContain("predicted");
    }
  });
});
