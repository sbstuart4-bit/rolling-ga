"use server";

import { composePilotMailto, validatePilotInquiry, type PilotFieldErrors } from "@/lib/marketing-pilot";

export interface PilotFormState {
  success?: boolean;
  mailto?: string;
  error?: string;
  fieldErrors?: PilotFieldErrors;
}

export async function submitPilotInquiry(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const parsed = validatePilotInquiry({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    organization: formData.get("organization"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  const inbox = process.env.PILOT_INBOX?.trim();
  return {
    success: true,
    mailto: inbox ? composePilotMailto(inbox, parsed.data) : undefined,
  };
}
