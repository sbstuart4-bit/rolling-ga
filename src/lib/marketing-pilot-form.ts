import type { PilotFieldErrors } from "@/lib/marketing-pilot";

export interface PilotFormState {
  success?: boolean;
  notConfigured?: boolean;
  error?: string;
  fieldErrors?: PilotFieldErrors;
}

export const PILOT_SEND_ERROR_MESSAGE =
  "We couldn't send your inquiry right now. Your information was not submitted. Please try again.";
