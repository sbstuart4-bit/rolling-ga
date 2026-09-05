"use client";

import { useEffect } from "react";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { returnToDemoBoardAction } from "@/server/demo/session-actions";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#121212] px-6 py-16 text-center">
      <RollingGaLogo size="default" />
      <h1 className="mt-8 font-display text-3xl tracking-wide">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground text-balance">
        Rolling GA hit an unexpected error. You can try again, or return to the demo board to
        restart your walkthrough.
      </p>
      <form className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="submit" variant="outline" formAction={returnToDemoBoardAction}>
          Back to demo board
        </Button>
      </form>
      {error.digest && (
        <p className="mt-6 font-mono text-[11px] text-muted-foreground">Reference: {error.digest}</p>
      )}
    </div>
  );
}
