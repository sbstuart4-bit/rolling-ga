import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPilotDeliveryConfig, sendPilotInquiryEmail } from "@/server/marketing/pilot-delivery";
import { PILOT_SEND_ERROR_MESSAGE } from "@/lib/marketing-pilot-form";
import { submitPilotInquiry } from "@/server/marketing/pilot-action";

vi.mock("@/server/marketing/pilot-delivery", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/marketing/pilot-delivery")>();
  return {
    ...actual,
    getPilotDeliveryConfig: vi.fn(),
    sendPilotInquiryEmail: vi.fn(),
  };
});

const validFields = {
  name: "Jordan Hale",
  email: "jordan@example.com",
  organization: "The Degens",
  roleTitle: "Tour manager",
  partnerType: "Artist / Manager",
  hasShowInMind: "yes",
  opportunity: "Midwest club run",
  message: "Interested in a single-show pilot",
};

function makeFormData(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

describe("submitPilotInquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns validation errors without calling delivery", async () => {
    const result = await submitPilotInquiry({}, makeFormData({ name: "", email: "bad" }));

    expect(result.success).toBeUndefined();
    expect(result.fieldErrors?.name).toBeDefined();
    expect(result.fieldErrors?.email).toBeDefined();
    expect(getPilotDeliveryConfig).not.toHaveBeenCalled();
    expect(sendPilotInquiryEmail).not.toHaveBeenCalled();
  });

  it("returns notConfigured when delivery env is missing", async () => {
    vi.mocked(getPilotDeliveryConfig).mockReturnValue(null);

    const result = await submitPilotInquiry({}, makeFormData(validFields));

    expect(result.notConfigured).toBe(true);
    expect(result.success).toBeUndefined();
    expect(sendPilotInquiryEmail).not.toHaveBeenCalled();
  });

  it("returns success only after provider success", async () => {
    vi.mocked(getPilotDeliveryConfig).mockReturnValue({
      apiKey: "re_test",
      inbox: "pilots@example.com",
      fromEmail: "Rolling GA <pilots@yourdomain.com>",
    });
    vi.mocked(sendPilotInquiryEmail).mockResolvedValue({ ok: true });

    const result = await submitPilotInquiry({}, makeFormData(validFields));

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(sendPilotInquiryEmail).toHaveBeenCalledOnce();
  });

  it("returns a safe error when Resend fails", async () => {
    vi.mocked(getPilotDeliveryConfig).mockReturnValue({
      apiKey: "re_test",
      inbox: "pilots@example.com",
      fromEmail: "Rolling GA <pilots@yourdomain.com>",
    });
    vi.mocked(sendPilotInquiryEmail).mockResolvedValue({ ok: false });

    const result = await submitPilotInquiry({}, makeFormData(validFields));

    expect(result.success).toBeUndefined();
    expect(result.error).toBe(PILOT_SEND_ERROR_MESSAGE);
  });
});
