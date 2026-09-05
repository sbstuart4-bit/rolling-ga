import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplashBackdrop } from "@/components/auth/auth-splash-backdrop";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { demoModeEnabled } from "@/lib/demo-mode";
import { getAuthContext } from "@/server/auth/session";

/**
 * Full-bleed splash — the first thing an unauthenticated visitor sees.
 * Matches the product mockup: concert atmosphere, stacked wordmark, three CTAs.
 */
export default async function WelcomePage(props: PageProps<"/welcome">) {
  const ctx = await getAuthContext();
  const { next } = await props.searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : undefined;

  if (!ctx && demoModeEnabled()) redirect("/demo");
  if (ctx) redirect(nextPath ?? "/");

  const signUpHref = nextPath ? `/sign-up?next=${encodeURIComponent(nextPath)}` : "/sign-up";
  const signInHref = nextPath ? `/sign-in?next=${encodeURIComponent(nextPath)}` : "/sign-in";
  const guestHref = nextPath
    ? `/sign-in?guest=1&next=${encodeURIComponent(nextPath)}`
    : "/sign-in?guest=1";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#121212]">
      <AuthSplashBackdrop />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <RollingGaLogo size="hero" className="mb-8" />

        <p className="max-w-xs font-display text-lg leading-snug tracking-wide text-foreground">
          The show ends.
          <br />
          <span className="text-primary">The connection doesn&rsquo;t.</span>
        </p>
      </div>

      <div className="relative space-y-3 px-6 pb-10 pt-4">
        <Button
          asChild
          size="lg"
          className="h-14 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
        >
          <Link href={signUpHref}>Get started</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-14 w-full rounded-xl border-foreground/30 bg-transparent text-base font-semibold uppercase tracking-wider text-foreground hover:bg-foreground/5"
        >
          <Link href={signInHref}>Log in</Link>
        </Button>

        <div className="space-y-2 pt-2 text-center">
          <Link
            href={guestHref}
            className="block text-sm font-medium uppercase tracking-wider text-primary hover:text-primary/80"
          >
            Continue as guest
          </Link>
          <Link
            href="/demo"
            className="block text-xs font-medium uppercase tracking-wider text-foreground/50 hover:text-foreground/80"
          >
            Explore every persona →
          </Link>
        </div>
      </div>
    </div>
  );
}
