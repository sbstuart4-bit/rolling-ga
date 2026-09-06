import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplashBackdrop } from "@/components/auth/auth-splash-backdrop";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { COMING_SOON_GUIDED_JOURNEYS, listActiveGuidedJourneys } from "@/lib/guided-demo";
import { demoModeEnabled } from "@/server/demo/accounts";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { startGuidedDemoAction } from "@/server/demo/guided-demo-actions";

export const metadata: Metadata = { title: "Guided demo — Rolling GA" };
export const dynamic = "force-dynamic";

export default async function GuidedDemoChooserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!demoModeEnabled()) redirect("/welcome");

  const params = await searchParams;
  const boardAccess = await hasDemoBoardAccess();
  const journeys = listActiveGuidedJourneys();
  const complete = params.complete === "1";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#121212]">
      <AuthSplashBackdrop />

      <div className="relative flex flex-col items-center px-6 pt-14 pb-8 text-center">
        <Link href="/demo?perspective=fan" className="inline-block" aria-label="Back to demo board">
          <RollingGaLogo size="default" />
        </Link>
        <h1 className="mt-6 font-display text-3xl tracking-wide">Guided demo</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground text-balance">
          Present the real fan product step by step — clock, location, and eligibility update
          through the existing demo engine.
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 pb-16">
        {complete ? (
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h2 className="text-lg font-semibold">Journey complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You finished The Degens — Full Rolling GA Journey.
            </p>
            <Button asChild className="mt-4 uppercase tracking-wider">
              <Link href="/demo?perspective=fan">Back to demo board</Link>
            </Button>
          </section>
        ) : null}

        <div className="grid gap-4">
          {journeys.map((journey) => (
            <section
              key={journey.id}
              className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-left"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {journey.subtitle}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">{journey.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{journey.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Approximate duration: {journey.durationLabel}
              </p>

              {boardAccess ? (
                <form action={startGuidedDemoAction} className="mt-5 space-y-3">
                  <input type="hidden" name="journeyId" value={journey.id} />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" name="presenter" value="1" className="rounded border-border" />
                    Start with presenter mode on
                  </label>
                  <Button type="submit" className="h-11 w-full uppercase tracking-wider sm:w-auto">
                    Start guided demo
                  </Button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Demo board access is required to start a guided journey.{" "}
                  <Link href="/demo?perspective=fan" className="text-primary hover:underline">
                    Return to demo board
                  </Link>
                  .
                </p>
              )}
            </section>
          ))}

          {COMING_SOON_GUIDED_JOURNEYS.map((item) => (
            <section
              key={item.id}
              className="rounded-2xl border border-border bg-card/40 p-6 text-left opacity-70"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Coming soon
              </p>
              <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
            </section>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/demo?perspective=fan" className="font-medium text-primary hover:underline">
            ← Back to demo board
          </Link>
        </p>
      </div>
    </div>
  );
}
