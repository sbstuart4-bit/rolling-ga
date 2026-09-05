import type { Metadata } from "next";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type PlatformRole } from "@/lib/types";
import { getAuthContext } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "No access" };

function describeRequirement(need: string | undefined): string {
  if (!need) return "a different account";
  if (need === "artist_member") return "an artist team account";

  const labels = need
    .split(",")
    .map((role) => ROLE_LABELS[role as PlatformRole])
    .filter(Boolean);

  return labels.length > 0 ? labels.join(" or ") : "a different account";
}

export default async function NoAccessPage(props: PageProps<"/no-access">) {
  const { need } = await props.searchParams;
  const ctx = await getAuthContext();

  return (
    <main className="space-y-8 text-center">
      <RollingGaMark size="lg" />

      <div className="space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <ShieldOff className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">This area isn&rsquo;t yours</h1>
        <p className="text-sm text-muted-foreground text-balance">
          {ctx ? (
            <>
              You&rsquo;re signed in as <strong className="text-foreground">{ctx.displayName}</strong>
              . This section needs {describeRequirement(typeof need === "string" ? need : undefined)}.
            </>
          ) : (
            <>This section needs {describeRequirement(typeof need === "string" ? need : undefined)}.</>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild size="lg">
          <Link href="/">Back to Rolling GA</Link>
        </Button>
        <SignOutButton variant="ghost" className="w-full">
          Sign in as someone else
        </SignOutButton>
      </div>
    </main>
  );
}
