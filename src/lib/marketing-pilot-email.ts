import { createHash } from "node:crypto";
import type { PilotInquiry } from "@/lib/marketing-pilot";

const PARTNER_TYPE_LABEL: Record<PilotInquiry["partnerType"], string> = {
  "Artist / Manager": "Artist / Manager",
  Venue: "Venue",
  Promoter: "Promoter",
  "Merch / Fulfillment Partner": "Merch / Fulfillment Partner",
  "Label / Artist Team": "Label / Artist Team",
  Other: "Other",
};

export function escapePilotEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPilotInquirySubject(inquiry: PilotInquiry): string {
  if (inquiry.opportunity?.trim()) {
    return `New Rolling GA pilot inquiry — ${inquiry.opportunity.trim().slice(0, 80)}`;
  }
  if (inquiry.organization?.trim()) {
    return `New Rolling GA pilot inquiry — ${inquiry.organization.trim()}`;
  }
  return "New Rolling GA pilot inquiry";
}

function formatOptionalField(label: string, value: string | undefined): string {
  return value?.trim() ? `${label}: ${value.trim()}` : `${label}: (not provided)`;
}

export function buildPilotInquiryPlainText(inquiry: PilotInquiry): string {
  return [
    "New Rolling GA pilot inquiry",
    "",
    `Name: ${inquiry.name}`,
    `Work email: ${inquiry.email}`,
    formatOptionalField("Organization", inquiry.organization),
    formatOptionalField("Role", inquiry.roleTitle),
    `I am a: ${PARTNER_TYPE_LABEL[inquiry.partnerType]}`,
    `Show in mind: ${inquiry.hasShowInMind === "yes" ? "Yes" : "Not yet"}`,
    formatOptionalField("Show / artist / opportunity", inquiry.opportunity),
    "",
    inquiry.message?.trim() ? `Message:\n${inquiry.message.trim()}` : "Message: (none)",
  ].join("\n");
}

export function buildPilotInquiryHtml(inquiry: PilotInquiry): string {
  const rows = [
    ["Name", inquiry.name],
    ["Work email", inquiry.email],
    ["Organization", inquiry.organization?.trim() || "(not provided)"],
    ["Role", inquiry.roleTitle?.trim() || "(not provided)"],
    ["I am a", PARTNER_TYPE_LABEL[inquiry.partnerType]],
    ["Show in mind", inquiry.hasShowInMind === "yes" ? "Yes" : "Not yet"],
    [
      "Show / artist / opportunity",
      inquiry.opportunity?.trim() || "(not provided)",
    ],
    ["Message", inquiry.message?.trim() || "(none)"],
  ] as const;

  const bodyRows = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" valign="top" style="padding:8px 12px 8px 0;font-family:sans-serif;font-size:14px;color:#52525b;">${escapePilotEmailHtml(label)}</th><td style="padding:8px 0;font-family:sans-serif;font-size:14px;color:#0a0a0a;white-space:pre-wrap;">${escapePilotEmailHtml(value)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#ffffff;font-family:sans-serif;"><h1 style="margin:0 0 16px;font-size:20px;color:#0a0a0a;">New Rolling GA pilot inquiry</h1><table role="presentation" cellspacing="0" cellpadding="0" border="0">${bodyRows}</table></body></html>`;
}

export function buildPilotInquiryIdempotencyKey(inquiry: PilotInquiry): string {
  const payload = JSON.stringify({
    name: inquiry.name,
    email: inquiry.email,
    organization: inquiry.organization ?? "",
    roleTitle: inquiry.roleTitle ?? "",
    partnerType: inquiry.partnerType,
    hasShowInMind: inquiry.hasShowInMind,
    opportunity: inquiry.opportunity ?? "",
    message: inquiry.message ?? "",
  });

  return createHash("sha256").update(payload).digest("hex");
}

export function buildPilotInquiryEmail(inquiry: PilotInquiry) {
  return {
    subject: buildPilotInquirySubject(inquiry),
    text: buildPilotInquiryPlainText(inquiry),
    html: buildPilotInquiryHtml(inquiry),
    replyTo: inquiry.email,
    idempotencyKey: buildPilotInquiryIdempotencyKey(inquiry),
  };
}
