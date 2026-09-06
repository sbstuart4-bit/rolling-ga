import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Rolling GA — Live music lives on.",
    template: "%s · Rolling GA",
  },
  description:
    "Rolling GA turns concert attendance into a verified, permissioned fan relationship. The product experience is built — we're seeking artists and industry partners for pilots.",
  openGraph: {
    title: "Rolling GA — Live music lives on.",
    description:
      "Merch without the merch line. Built for pilots with artists, venues and industry partners.",
    siteName: "Rolling GA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rolling GA — Live music lives on.",
    description:
      "Merch without the merch line. Built for pilots with artists, venues and industry partners.",
  },
};

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div data-mkt="site" className="min-h-dvh overflow-x-clip bg-mkt-bg text-mkt-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-mkt-purple focus:px-3 focus:py-2 focus:text-mkt-purple-fg"
      >
        Skip to content
      </a>
      <MarketingNav />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
