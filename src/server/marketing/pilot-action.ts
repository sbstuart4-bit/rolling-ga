"use server";

import { PILOT_SEND_ERROR_MESSAGE, type PilotFormState } from "@/lib/marketing-pilot-form";
import { validatePilotInquiry } from "@/lib/marketing-pilot";
import { getPilotDeliveryConfig, sendPilotInquiryEmail } from "@/server/marketing/pilot-delivery";

export async function submitPilotInquiry(
  _prev: PilotFormState,
  formData: FormData,
): Promise<PilotFormState> {
  const parsed = validatePilotInquiry({
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization") || undefined,
    roleTitle: formData.get("roleTitle") || undefined,
    partnerType: formData.get("partnerType"),
    hasShowInMind: formData.get("hasShowInMind"),
    opportunity: formData.get("opportunity") || undefined,
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  const config = getPilotDeliveryConfig();
  if (!config) {
    return { notConfigured: true };
  }

  const sent = await sendPilotInquiryEmail(parsed.data, config);
  if (!sent.ok) {
    return { error: PILOT_SEND_ERROR_MESSAGE };
  }

  return { success: true };
}
