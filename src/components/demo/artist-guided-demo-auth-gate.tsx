"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { bootstrapArtistGuidedDemoSessionAction } from "@/server/demo/artist-guided-demo-bootstrap-action";

export function ArtistGuidedDemoAuthGate({
  guided,
  step,
  presenter,
  autoplay,
}: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [redirectTo, setRedirectTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void bootstrapArtistGuidedDemoSessionAction({ guided, step, presenter, autoplay }).then(
      (result) => {
        if (cancelled) return;

        if (result.ok) {
          router.refresh();
          return;
        }

        if (result.redirectTo) {
          router.replace(result.redirectTo);
          return;
        }

        setError(result.error);
        setRedirectTo("/home");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [guided, step, presenter, autoplay, router]);

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
