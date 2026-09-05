import Link from "next/link";
import { RollingGaLogo, RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { MARKETING_NAV } from "@/components/marketing/marketing-fixtures";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#0c0c0e]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <RollingGaLogo />
          <p className="eyebrow text-primary">I was there</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            The show ends. The connection doesn&rsquo;t.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3">
          {MARKETING_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
            Log in
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <RollingGaMark size="sm" className="text-muted-foreground" />
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Artist-controlled. Permissioned.
          </p>
        </div>
      </div>
    </footer>
  );
}
