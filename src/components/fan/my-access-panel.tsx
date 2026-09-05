import Link from "next/link";
import { Gift, ShoppingBag, Sparkles, Users } from "lucide-react";
import type { ShowAccessSummary } from "@/server/fans/passport-access";

export function MyAccessPanel({
  slug,
  artistName,
  access,
}: {
  slug: string;
  artistName: string;
  access: ShowAccessSummary;
}) {
  const items = [
    {
      id: "purchases",
      label: "My purchases",
      detail:
        access.purchaseCount > 0
          ? `${access.purchaseCount} order${access.purchaseCount !== 1 ? "s" : ""} from this show`
          : "Nothing purchased yet",
      href: `/event/${slug}/shop`,
      active: access.purchaseCount > 0,
      icon: ShoppingBag,
    },
    {
      id: "drops",
      label: "Attendee drops",
      detail:
        access.attendeeDropCount > 0
          ? `${access.attendeeDropCount} drop${access.attendeeDropCount !== 1 ? "s" : ""} unlocked`
          : "No drops available",
      href: `/event/${slug}/shop`,
      active: access.attendeeDropCount > 0,
      icon: Gift,
    },
    {
      id: "anniversary",
      label: "Anniversary access",
      detail: access.hasAnniversaryAccess
        ? "Anniversary drop available for attendees"
        : "Not yet available",
      href: `/drops`,
      active: access.hasAnniversaryAccess,
      icon: Sparkles,
    },
    {
      id: "connection",
      label: "Artist connection",
      detail: access.isConnected
        ? `Connected with ${artistName}`
        : "Stay connected to unlock ongoing access",
      href: `/event/${slug}`,
      active: access.isConnected,
      icon: Users,
    },
  ];

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card/50 p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          My access
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Ongoing benefits from your verified attendance
        </p>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 py-3 transition-colors hover:opacity-80"
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  item.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <item.icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
