"use client";

import "./globals.css";
import { allFontClassNames } from "@/lib/fonts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${allFontClassNames} dark h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">        <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
          <p className="font-display text-xs tracking-[0.18em] text-foreground">
            Rolling<span className="text-primary">&nbsp;GA</span>
          </p>
          <h1 className="mt-8 font-display text-3xl tracking-wide">Something went wrong</h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground text-balance">
            Rolling GA hit an unexpected error. Try again, or reload the page to restart the demo.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          {error.digest && (
            <p className="mt-6 font-mono text-[11px] text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
