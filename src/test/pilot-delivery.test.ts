import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPilotDeliveryConfig,
  sendPilotInquiryEmail,
  type PilotResendClient,
} from "@/server/marketing/pilot-delivery";

describe("pilot delivery", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires RESEND_API_KEY, PILOT_INBOX, and PILOT_FROM_EMAIL", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("PILOT_INBOX", "pilots@example.com");
    vi.stubEnv("PILOT_FROM_EMAIL", "Rolling GA <pilots@yourdomain.com>");

    expect(getPilotDeliveryConfig()).toBeNull();
  });

  it("returns config when all delivery env vars are set", () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("PILOT_INBOX", "pilots@example.com");
    vi.stubEnv("PILOT_FROM_EMAIL", "Rolling GA <pilots@yourdomain.com>");

    expect(getPilotDeliveryConfig()).toEqual({
      apiKey: "re_test",
      inbox: "pilots@example.com",
      fromEmail: "Rolling GA <pilots@yourdomain.com>",
    });
  });

  it("sends with reply-to, idempotency key, and recipient inbox", async () => {
    const send = vi.fn().mockResolvedValue({ data: { id: "email_123" }, error: null });
    const client: PilotResendClient = { emails: { send } };

    const inquiry = {
      name: "Jordan Hale",
      email: "jordan@example.com",
      partnerType: "Artist / Manager" as const,
      hasShowInMind: "yes" as const,
    };

    const result = await sendPilotInquiryEmail(
      inquiry,
      {
        apiKey: "re_test",
        inbox: "pilots@example.com",
        fromEmail: "Rolling GA <pilots@yourdomain.com>",
      },
      client,
    );

    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalledOnce();

    const payload = send.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.from).toBe("Rolling GA <pilots@yourdomain.com>");
    expect(payload.to).toEqual(["pilots@example.com"]);
    expect(payload.replyTo).toBe("jordan@example.com");
    expect(payload.headers).toEqual(
      expect.objectContaining({
        "Idempotency-Key": expect.any(String),
      }),
    );
  });

  it("returns failure when Resend reports an error", async () => {
    const send = vi.fn().mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Invalid from address" },
    });
    const client: PilotResendClient = { emails: { send } };

    const result = await sendPilotInquiryEmail(
      {
        name: "Jordan Hale",
        email: "jordan@example.com",
        partnerType: "Venue",
        hasShowInMind: "not_yet",
      },
      {
        apiKey: "re_test",
        inbox: "pilots@example.com",
        fromEmail: "Rolling GA <pilots@yourdomain.com>",
      },
      client,
    );

    expect(result.ok).toBe(false);
  });
});
