import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";

/**
 * Concert-atmosphere background shared by every unauthenticated screen — the splash,
 * sign-in, and sign-up all live on the same backdrop so moving between them feels like
 * one continuous scene rather than a flash to a plain page.
 */
export function AuthSplashBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${THE_DEGENS_DEMO_ASSETS.tourHero})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#121212]/30 via-[#121212]/70 to-[#121212]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#7b3cff]/20 to-transparent"
        aria-hidden
      />
    </>
  );
}
