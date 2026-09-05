import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Shows — Rolling GA Ops" };

export default function PlatformOpsShowsPlaceholder() {
  return (
    <PlaceholderSection
      title="Shows"
      description="Cross-artist show inspection is planned. Use the demo scenario engine to walk individual show journeys, or open fulfillment events for live operational data."
      links={[
        { href: "/demo?perspective=fan", label: "Demo scenario engine" },
        { href: "/ops/events", label: "Fulfillment events desk" },
      ]}
    />
  );
}

function PlaceholderSection({
  title,
  description,
  links,
}: {
  title: string;
  description: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground text-balance">{description}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-sky-500/40"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
