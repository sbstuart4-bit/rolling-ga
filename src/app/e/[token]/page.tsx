import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, RotateCcw, TimerOff } from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { resolveVerificationToken } from "@/server/events/queries";

export const metadata: Metadata = { title: "Scanning…" };

/**
 * The QR scan target.
 *
 * The token is resolved to a show and the fan is forwarded straight to verification, so
 * the URL printed on a venue screen never has to change. Invalid, rotated and expired
 * codes each get their own explanation rather than one generic error.
 */
export default async function ScanEntryPage(props: PageProps<"/e/[token]">) {
  const { token } = await props.params;
  const resolution = await resolveVerificationToken(token);

  if (resolution.ok) {
    redirect(`/event/${resolution.slug}/verify?t=${encodeURIComponent(token)}`);
  }

  const states = {
    unknown: {
      icon: QrCode,
      title: "That code isn't one of ours",
      body: "The link may have been mistyped, or the code belongs to a show that has since been removed.",
    },
    rotated: {
      icon: RotateCcw,
      title: "This code has been replaced",
      body: "Codes rotate during a show. Scan the one currently on the screen at the venue, or ask staff for the verification code.",
    },
    expired: {
      icon: TimerOff,
      title: "This code has expired",
      body: "Verification for this show has closed. Your credential can only be earned while you're at the show.",
    },
  } as const;

  const state = states[resolution.reason];
  const Icon = state.icon;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <RollingGaMark size="lg" />

      <div className="space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{state.title}</h1>
        <p className="text-sm text-muted-foreground text-balance">{state.body}</p>
      </div>

      <div className="flex w-full flex-col gap-2">
        {resolution.slug && (
          <Button asChild size="lg">
            <Link href={`/event/${resolution.slug}`}>Go to the show</Link>
          </Button>
        )}
        <Button asChild variant={resolution.slug ? "outline" : "default"} size="lg">
          <Link href="/">Back to Rolling GA</Link>
        </Button>
      </div>
    </main>
  );
}
