"use client";

import * as React from "react";
import Link from "next/link";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";

const BOOTSTRAP_ATTEMPTS_KEY = "rga-artist-guided-bootstrap-attempts";

/**
 * Anonymous artist guided-demo entry lands here when the studio layout needs a
 * Elena session. Route handlers are the reliable place to write auth cookies, so
 * we bounce through `/api/demo/enter-guided` instead of a Server Action.
 */
export function ArtistGuidedDemoAuthGate({
  guided: _guided,
  step: _step,
  presenter: _presenter,
  autoplay: _autoplay,
}: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const attempts = Number(sessionStorage.getItem(BOOTSTRAP_ATTEMPTS_KEY) ?? "0");

    if (attempts >= 2) {
      sessionStorage.removeItem(BOOTSTRAP_ATTEMPTS_KEY);
      setError(
        "Demo sign-in did not complete. The Elena demo account may be missing from the database — try again in a few minutes or contact us for a pilot walkthrough.",
      );
      setRedirectTo("/home");
      return;
    }

    sessionStorage.setItem(BOOTSTRAP_ATTEMPTS_KEY, String(attempts + 1));
    window.location.replace(
      `/api/demo/enter-guided?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#121212] px-6 py-16 text-center">
      <RollingGaLogo size="default" />
      {error ? (
        <>
          <h1 className="mt-8 font-display text-2xl tracking-wide">Could not start demo</h1>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground text-balance">{error}</p>
          <Button asChild className="mt-8 uppercase tracking-wider">
            <Link href={redirectTo ?? "/home"}>Back to homepage</Link>
          </Button>
        </>
      ) : (
        <>
          <h1 className="mt-8 font-display text-2xl tracking-wide">Starting artist demo</h1>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground text-balance">
            Signing you in as Elena Vasquez, Marisol Reyes merch manager&hellip;
          </p>
        </>
      )}
    </div>
  );
}
