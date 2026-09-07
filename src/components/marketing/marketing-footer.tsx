import Link from "next/link";
import { Circle } from "lucide-react";
import { RollingGaHomeLink } from "@/components/brand/rolling-ga-mark";
import {
  MARKETING_FOOTER_COLUMNS,
  MARKETING_TAGLINE,
} from "@/components/marketing/marketing-fixtures";
import { experienceArtistStudioAction } from "@/server/marketing/demo-entry";

/**
 * Approved footer — docs/website-reference.
 * Five-column structure + newsletter shell. No fabricated social URLs or
 * newsletter backend until explicitly provided.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-mkt-border bg-mkt-bg">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
          <div className="space-y-6">
            <RollingGaHomeLink
              className="focus-visible:ring-mkt-purple focus-visible:ring-offset-mkt-bg"
              markClassName="font-semibold text-mkt-fg"
              size="lg"
              tone="brand"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mkt-purple">
              {MARKETING_TAGLINE}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-mkt-muted">
              The product experience is built. We&rsquo;re looking for artists and industry
              partners to pilot it in the real world.
            </p>
            {/* Social placeholders — structure only, no fabricated account URLs. */}
            <div className="flex gap-4" aria-label="Social media (coming soon)">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="flex size-9 items-center justify-center rounded-full border border-mkt-border text-mkt-muted"
                  aria-hidden
                >
                  <Circle className="size-4" strokeWidth={1.5} />
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETING_FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-mkt-fg">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      {link.label === "Demo" ? (
                        <form action={experienceArtistStudioAction}>
                          <button
                            type="submit"
                            className="text-sm text-mkt-muted transition-colors hover:text-mkt-fg"
                          >
                            Demo
                          </button>
                        </form>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-mkt-muted transition-colors hover:text-mkt-fg"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter shell — no submission handler until product provides one. */}
        <div className="mt-16 border-t border-mkt-border pt-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-mkt-fg">
            Stay in the loop
          </p>
          <div className="flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              disabled
              placeholder="Email address"
              aria-label="Email address for updates"
              className="h-11 flex-1 rounded-full border border-mkt-border bg-mkt-surface px-5 text-sm text-mkt-muted"
            />
            <button
              type="button"
              disabled
              className="h-11 rounded-full bg-mkt-purple px-6 text-xs font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg opacity-60"
            >
              Coming soon
            </button>
          </div>
          <p className="mt-3 text-xs text-mkt-muted">Pilot updates — signup not yet available.</p>
        </div>
      </div>

      <div className="border-t border-mkt-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-mkt-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>&copy; {new Date().getFullYear()} Rolling GA. All rights reserved.</p>
          <div className="flex flex-wrap gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
