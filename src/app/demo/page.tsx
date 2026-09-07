import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Disc3, Mic2, ShieldCheck, Truck } from "lucide-react";
import { AuthSplashBackdrop } from "@/components/auth/auth-splash-backdrop";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { DemoPerspectiveSelector } from "@/components/demo/demo-perspective-selector";
import { DemoPerspectiveScroll } from "@/components/demo/demo-perspective-scroll";
import { GuidedDemoModeSelector } from "@/components/demo/guided-demo-mode-selector";
import { DemoOpsControls } from "@/components/demo/demo-ops-controls";
import { DemoClockControls } from "@/components/demo/demo-clock-controls";
import { DemoScenarioControls } from "@/components/demo/demo-scenario-controls";
import { DemoSessionReset } from "@/components/demo/demo-session-reset";
import { Button } from "@/components/ui/button";
import { DEMO_PERSPECTIVE_LABELS, parseDemoPerspective } from "@/lib/demo-perspective";
import { ROLE_LABELS, type PlatformRole } from "@/lib/types";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { hostedDemoBoardGateRequired } from "@/lib/production-env";
import { demoModeEnabled, listDemoAccounts, type DemoAccount } from "@/server/demo/accounts";
import { getDemoClockState } from "@/server/demo/clock";
import { getDemoScenario } from "@/server/demo/scenario-state";
import { startPersonaAction, startScottMarisolBrooklynLiveAction } from "@/server/demo/persona-actions";
import { startArtistGuidedDemoAction } from "@/server/demo/artist-guided-demo-actions";

export const metadata: Metadata = { title: "Demo board — Rolling GA" };
export const dynamic = "force-dynamic";

const ROLE_ICON: Record<PlatformRole, typeof Mic2> = {
  fan: Disc3,
  artist_member: Mic2,
  rga_admin: ShieldCheck,
  fulfillment_operator: Truck,
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DATE_FMT_SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SUBTITLE: Record<ReturnType<typeof parseDemoPerspective>, string> = {
  fan: "Configure a scenario across four artists, preview the expected experience, then enter the real fan journey.",
  artist: "Enter Artist Studio personas and manage tour, merch, drops, and fan relationships.",
  ops: "Operate the platform across all demo artists — asset QA, catalog inspection, and operational visibility.",
};

export default async function DemoBoardPage(props: PageProps<"/demo">) {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const searchParams = await props.searchParams;
  const perspective = parseDemoPerspective(searchParams.perspective);
  const boardAccess = await hasDemoBoardAccess();
  const [accounts, clock, scenario] = await Promise.all([
    boardAccess ? listDemoAccounts() : Promise.resolve([] as DemoAccount[]),
    Promise.resolve(getDemoClockState()),
    getDemoScenario(searchParams),
  ]);

  const artistAccounts = accounts
    .filter((a) => a.roles.includes("artist_member"))
    .sort((a, b) => {
      if (a.email === "elena@marisolreyes.example") return -1;
      if (b.email === "elena@marisolreyes.example") return 1;
      return a.displayName.localeCompare(b.displayName);
    });
  const fanAccounts = accounts.filter((a) => a.roles.includes("fan"));

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#121212]">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <AuthSplashBackdrop />
      </div>
      <DemoSessionReset />

      <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-10 text-center">
        <Link href="/demo" className="inline-block" aria-label="Rolling GA demo board">
          <RollingGaLogo size="default" />
        </Link>
        <h1 className="mt-6 font-display text-3xl tracking-wide">Demo board</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground text-balance">{SUBTITLE[perspective]}</p>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 pb-16">
        <DemoPerspectiveSelector active={perspective} />

        <div id="demo-perspective-content" className="scroll-mt-6 space-y-10">
        <Suspense fallback={null}>
          <DemoPerspectiveScroll />
        </Suspense>
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Viewing:{" "}
          <span className="font-semibold text-foreground">
            {DEMO_PERSPECTIVE_LABELS[perspective]}
          </span>
        </p>

        {perspective === "ops" && <DemoOpsControls />}

        {perspective === "fan" && (
          <>
            <GuidedDemoModeSelector />

            <DemoScenarioControls initialScenario={scenario} boardAccess={boardAccess} />

            <DemoClockControls
              now={DATE_FMT.format(clock.now)}
              anchor={DATE_FMT_SHORT.format(clock.anchor)}
              showDate={DATE_FMT_SHORT.format(clock.showDate)}
              days={clock.days}
              hours={clock.hours}
              maxDays={clock.maxDays}
              maxHours={clock.maxHours}
            />

            {boardAccess && (
              <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                <h2 className="text-lg font-semibold tracking-tight">Featured fan walkthrough</h2>
                <p className="mt-2 text-sm text-muted-foreground text-balance">
                  Sets the clock to Brooklyn live (June 12, 8:00 PM), signs in as Scott Weller, and
                  opens Marisol Reyes at Warehouse Nine — ready to verify.
                </p>
                <form action={startScottMarisolBrooklynLiveAction} className="mt-4">
                  <Button
                    type="submit"
                    className="h-11 w-full bg-primary uppercase tracking-wider hover:bg-primary/90 sm:w-auto"
                  >
                    Start Brooklyn live as Scott
                  </Button>
                </form>
              </section>
            )}

            {!boardAccess && hostedDemoBoardGateRequired() ? (
              <DemoAccessGate />
            ) : (
              <PersonaSection title="Start a fan journey" accounts={fanAccounts} />
            )}
          </>
        )}

        {perspective === "artist" && (
          <>
            {boardAccess && (
              <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                <h2 className="text-lg font-semibold tracking-tight">
                  Featured artist walkthrough
                </h2>
                <p className="mt-2 text-sm text-muted-foreground text-balance">
                  Six-step guided tour of Marisol Reyes Artist Studio — Brooklyn · A Tender Night.
                  Signs in as Elena Vasquez and walks the real show → merch → fans → activation
                  story.
                </p>
                <form action={startArtistGuidedDemoAction} className="mt-4">
                  <input type="hidden" name="journeyId" value="marisol-artist-studio" />
                  <Button
                    type="submit"
                    className="h-11 w-full bg-primary uppercase tracking-wider hover:bg-primary/90 sm:w-auto"
                  >
                    Run Marisol Artist Studio demo
                  </Button>
                </form>
              </section>
            )}

            {!boardAccess && hostedDemoBoardGateRequired() ? (
              <DemoAccessGate />
            ) : (
              <PersonaSection title="Artist Studio personas" accounts={artistAccounts} />
            )}
          </>
        )}

        {boardAccess && perspective !== "ops" && (
          <p className="text-center text-sm text-muted-foreground">
            Rather sign in by hand?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Use the sign-in form
            </Link>
          </p>
        )}
        </div>
      </div>
    </div>
  );
}

function DemoAccessGate() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 text-left">
      <h2 className="text-lg font-semibold tracking-tight">Demo access required</h2>
      <p className="mt-2 text-sm text-muted-foreground text-balance">
        Passwordless persona login is restricted on hosted demo deployments. Open the demo board
        using the private access link shared by your Rolling GA operator, then return here to pick
        a persona.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have credentials?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in with email and password
        </Link>
        .
      </p>
    </section>
  );
}

function PersonaSection({ title, accounts }: { title: string; accounts: DemoAccount[] }) {
  return (
    <section className="space-y-4">
      <h2 className="eyebrow text-muted-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <PersonaCard key={account.email} account={account} />
        ))}
      </div>
    </section>
  );
}

function PersonaCard({ account }: { account: DemoAccount }) {
  const primaryRole = account.roles[0];
  const Icon = ROLE_ICON[primaryRole];
  const firstName = account.displayName.split(" ")[0] || account.displayName;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-medium">{account.displayName}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {account.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
          </p>
        </div>
      </div>

      <p className="flex-1 text-sm text-muted-foreground">{account.blurb}</p>

      <form action={startPersonaAction}>
        <input type="hidden" name="email" value={account.email} />
        <Button type="submit" className="h-10 w-full bg-primary uppercase tracking-wider hover:bg-primary/90">
          Start as {firstName}
        </Button>
      </form>
    </div>
  );
}
