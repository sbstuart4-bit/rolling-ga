/** Onboarding is full-bleed, like the splash screen — no fan tab bar or header yet. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#121212]">{children}</div>;
}
