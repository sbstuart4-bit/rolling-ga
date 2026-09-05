import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Globe, Package, ShoppingBag, User } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DemoBoardReturn } from "@/components/demo/demo-board-return";
import { demoModeEnabled } from "@/lib/demo-mode";
import { initialsOf } from "@/lib/format";
import { requireAuth } from "@/server/auth/request";
import { getPassportStats } from "@/server/attendance/queries";

export const metadata: Metadata = { title: "Profile — Rolling GA" };

export default async function ProfilePage() {
  const ctx = await requireAuth("/profile");
  const stats = await getPassportStats(ctx.userId);

  return (
    <div className="mx-auto max-w-lg">
      <header className="border-b border-border bg-background/80 px-4 py-4 backdrop-blur">
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      </header>

      <div className="space-y-6 px-4 pt-6">
        {/* Avatar + ID */}
        <div className="flex items-center gap-4">
          <div
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold"
            aria-hidden
          >
            {initialsOf(ctx.displayName)}
          </div>
          <div>
            <p className="font-semibold">{ctx.displayName}</p>
            <p className="text-sm text-muted-foreground">{stats.shows} show{stats.shows === 1 ? "" : "s"} verified</p>
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Profile sections">
          <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            <ProfileLink href="/shows" icon={ShoppingBag} label="My Shows" description="Your concert passport" />
            <ProfileLink href="/profile/preferences" icon={User} label="Preferences & sizes" description="Shirt size, categories" />
            <ProfileLink href="/profile/shipping" icon={Package} label="Shipping address" description="Default delivery address" />
            <ProfileLink href="/profile/connections" icon={Globe} label="Artist connections" description="Manage consent and permissions" />
            <li>
              <DemoBoardReturn variant="row" show={demoModeEnabled()} />
            </li>
          </ul>
        </nav>

        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-muted-foreground">Rolling GA ID</p>
            <p className="font-mono text-xs text-muted-foreground">
              {ctx.userId.slice(0, 8)}
            </p>
          </div>
          <div className="border-t border-border">
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 bg-card px-4 py-3.5 transition-colors hover:bg-accent"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
      </Link>
    </li>
  );
}
