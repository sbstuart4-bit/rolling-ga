import { Resend } from "resend";
import type { PilotInquiry } from "@/lib/marketing-pilot";
import { buildPilotInquiryEmail } from "@/lib/marketing-pilot-email";

export interface PilotDeliveryConfig {
  apiKey: string;
  inbox: string;
  fromEmail: string;
}

export function getPilotDeliveryConfig(): PilotDeliveryConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const inbox = process.env.PILOT_INBOX?.trim();
  const fromEmail = process.env.PILOT_FROM_EMAIL?.trim();

  if (!apiKey || !inbox || !fromEmail) {
    return null;
  }

  return { apiKey, inbox, fromEmail };
}

export type PilotEmailSendResult = { ok: true } | { ok: false };

export type ResendSendResult = {
  data?: { id: string } | null;
  error?: { name: string; message?: string } | null;
};

export interface PilotResendClient {
  emails: {
    send: (payload: Record<string, unknown>) => Promise<ResendSendResult>;
  };
}

export async function sendPilotInquiryEmail(
  inquiry: PilotInquiry,
  config: PilotDeliveryConfig,
  resendClient?: PilotResendClient,
): Promise<PilotEmailSendResult> {
  const email = buildPilotInquiryEmail(inquiry);
  const resend = resendClient ?? new Resend(config.apiKey);

  try {
    const result = await resend.emails.send({
      from: config.fromEmail,
      to: [config.inbox],
      replyTo: email.replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
      headers: {
        "Idempotency-Key": email.idempotencyKey,
      },
    });

    if (result.error) {
      console.error("[pilot-inquiry] Resend rejected send:", result.error.name);
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "[pilot-inquiry] Resend send failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return { ok: false };
  }
}
