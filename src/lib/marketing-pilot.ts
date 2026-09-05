import { z } from "zod";

export const PILOT_ROLES = [
  "Artist manager",
  "Head of merch / commerce",
  "Tour manager",
  "Independent artist",
  "Management company",
  "Promoter / venue",
  "Label / other",
] as const;

export const pilotInquirySchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email."),
  role: z.enum(PILOT_ROLES),
  organization: z.string().trim().min(1, "Enter the artist or organization.").max(160),
  notes: z.string().trim().max(2000).optional(),
});

export type PilotInquiry = z.infer<typeof pilotInquirySchema>;

export type PilotFieldErrors = Partial<Record<keyof PilotInquiry, string>>;

export function validatePilotInquiry(input: unknown):
  | { success: true; data: PilotInquiry }
  | { success: false; fieldErrors: PilotFieldErrors } {
  const result = pilotInquirySchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: PilotFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key as keyof PilotInquiry] = issue.message;
    }
  }
  return { success: false, fieldErrors };
}

export function composePilotMailto(inbox: string, inquiry: PilotInquiry): string {
  const subject = `Rolling GA pilot — ${inquiry.organization}`;
  const body = [
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Role: ${inquiry.role}`,
    `Artist / organization: ${inquiry.organization}`,
    "",
    inquiry.notes ? `Notes:\n${inquiry.notes}` : "Notes: (none)",
  ].join("\n");

  return `mailto:${inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
