/** Where each curated demo persona lands after sign-in. */
export const PERSONA_DESTINATIONS: Record<string, string> = {
  "scott@example.com": "/",
  "marcus@thedegens.example": "/studio/live",
  "elena@marisolreyes.example": "/studio/live/evt_marisol_brooklyn",
  "dana@novakestrel.example": "/studio/drops",
  "priya@thelowcountry.example": "/studio/tour",
  "admin@rollingga.example": "/studio/insights",
  "ops@rollingga.example": "/ops",
};

export const MARCUS_VALE_EMAIL = "marcus@thedegens.example";
export const ELENA_MARISOL_EMAIL = "elena@marisolreyes.example";

export function getPersonaDestination(email: string): string | undefined {
  return PERSONA_DESTINATIONS[email.toLowerCase()];
}
