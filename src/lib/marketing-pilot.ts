import { z } from "zod";

export const PILOT_PARTNER_TYPES = [
  "Artist / Manager",
  "Venue",
  "Promoter",
  "Merch / Fulfillment Partner",
  "Label / Artist Team",
  "Other",
] as const;

/** @deprecated Use PILOT_PARTNER_TYPES — kept for legacy imports. */
export const PILOT_ROLES = PILOT_PARTNER_TYPES;

export const pilotInquirySchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().min(1, "Enter your work email.").email("Enter a valid email."),
  organization: z.string().trim().max(160).optional(),
  roleTitle: z.string().trim().max(120).optional(),
  partnerType: z.enum(PILOT_PARTNER_TYPES, { message: "Choose who you represent." }),
  hasShowInMind: z.enum(["yes", "not_yet"], { message: "Let us know if you have a show in mind." }),
  opportunity: z.string().trim().max(500).optional(),
  message: z.string().trim().max(2000).optional(),
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
