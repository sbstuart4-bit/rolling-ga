import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Rolling GA — The show ends. The connection doesn't.",
    template: "%s · Rolling GA",
  },
  description:
    "Rolling GA turns concert attendance into a verified, permissioned fan relationship that artists can monetize before, during, and after the show.",
  openGraph: {
    title: "Rolling GA — The show ends. The connection doesn't.",
    description:
      "Turn the audience in the room into a persistent artist-controlled commerce and relationship channel.",
    siteName: "Rolling GA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rolling GA — The show ends. The connection doesn't.",
    description:
      "Turn the audience in the room into a persistent artist-controlled commerce and relationship channel.",
  },
};

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-[#121212] text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <MarketingNav />
      <main id="main-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}
