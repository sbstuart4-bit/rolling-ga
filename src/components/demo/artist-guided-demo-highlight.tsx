import Link from "next/link";
import { ShowEconomicsCta } from "@/components/studio/show-economics-cta";
import { PilotReportCta } from "@/components/studio/pilot-report-cta";
import { FulfillmentCta } from "@/components/studio/fulfillment-cta";
import { ShowEconomicsHeadlineSummary } from "@/components/studio/show-economics-headline";
import { cohortHref } from "@/lib/relationship-intelligence/cohorts";
import { formatMoney, formatPercent } from "@/lib/format";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { defaultArtistId } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { getActiveArtistGuidedDemoContext } from "@/server/demo/artist-guided-demo-state";
import { loadShowCohortMetrics } from "@/server/studio/fan-relationship-queries";
import { loadShowEconomicsSnapshot } from "@/server/studio/show-economics-queries";
import { loadShowFulfillmentSnapshot } from "@/server/studio/fulfillment-queries";

export async function ArtistGuidedDemoHighlight() {
  const ctx = await getActiveArtistGuidedDemoContext();
  if (!ctx) return null;

  const { step, journey } = ctx;
  const economicsHref = `/studio/insights/economics/${MARISOL_BROOKLYN_EVENT_ID}`;

  if (step.step === 1) {
    return (
      <div className="mb-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/80 to-zinc-950 px-6 py-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
          Marisol Reyes
        </p>
        <h2 className="mt-1 font-display text-2xl tracking-wide md:text-3xl">A Tender Night</h2>
        <p className="mt-1 text-sm text-violet-100/80">Brooklyn · June 12, 2026</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">
          Tonight&apos;s show is a live commerce and relationship event — attendance, connected
          fans, purchasing fans and merch GMV update as the room fills.
        </p>
      </div>
    );
  }

  if (step.isConclusion) {
    const auth = await getAuthContext();
    const artistId = auth ? defaultArtistId(auth) : null;
    const economicsSnapshot =
      artistId && step.step === 6
        ? await loadShowEconomicsSnapshot(auth!, artistId, MARISOL_BROOKLYN_EVENT_ID)
        : null;
    const fulfillmentSnapshot =
      artistId && step.step === 6
        ? await loadShowFulfillmentSnapshot(auth!, artistId, MARISOL_BROOKLYN_EVENT_ID)
        : null;

    return (
      <div className="mb-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/90 via-zinc-950 to-black px-6 py-8 text-center text-white md:px-10 md:py-10">
        <p className="font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-tight tracking-wide">
          The show ends.
        </p>
        <p className="font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-tight tracking-wide text-violet-300">
          The relationship doesn&apos;t.
        </p>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-300">
          Rolling GA turns a night of live music into an audience the artist can know, serve and
          grow.
        </p>
        {fulfillmentSnapshot?.performance.deliveryPromiseRate != null ? (
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">
            {formatPercent(fulfillmentSnapshot.performance.deliveryPromiseRate)} delivered within
            promise
          </p>
        ) : null}
        {economicsSnapshot ? (
          <ShowEconomicsHeadlineSummary
            snapshot={economicsSnapshot}
            economicsHref={economicsHref}
            cohortHref={cohortHref(MARISOL_BROOKLYN_EVENT_ID)}
          />
        ) : null}
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <PilotReportCta eventId={MARISOL_BROOKLYN_EVENT_ID} prominent />
          <Link
            href="/studio/insights"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/5"
          >
            Explore Artist Studio
          </Link>
          <Link
            href="/pilot#conversation"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/5"
          >
            Run a pilot
          </Link>
        </div>
      </div>
    );
  }

  if (step.step === 2) {
    return (
      <div className="mb-6 space-y-4">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
            {journey.subtitle}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed">
            Show-scoped commerce for Brooklyn — compare physical booth economics to Rolling GA.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ShowEconomicsCta eventId={MARISOL_BROOKLYN_EVENT_ID} prominent />
          <FulfillmentCta eventId={MARISOL_BROOKLYN_EVENT_ID} prominent />
        </div>
      </div>
    );
  }

  if (step.step === 3) {
    const auth = await getAuthContext();
    const artistId = auth ? defaultArtistId(auth) : null;
    const cohort =
      artistId
        ? await loadShowCohortMetrics(auth!, artistId, MARISOL_BROOKLYN_EVENT_ID)
        : null;

    return (
      <div className="mb-6 space-y-4">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
            {journey.subtitle}
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed">
            {step.keyMessage ?? "Explore the relationship funnel — tap any stage to see the fans behind it."}
          </p>
        </div>
        {cohort ? (
          <div className="grid gap-3 rounded-xl border border-violet-500/20 bg-zinc-950/80 p-4 sm:grid-cols-4">
            <DemoMetric label="Connected" value={String(cohort.connectedFans)} />
            <DemoMetric label="Purchasing" value={String(cohort.purchasingFans)} />
            <DemoMetric label="Post-show" value={String(cohort.postShowPurchasers)} />
            <DemoMetric label="Post-show GMV" value={formatMoney(cohort.postShowGmv90DaysCents)} />
          </div>
        ) : null}
        <Link
          href={cohortHref(MARISOL_BROOKLYN_EVENT_ID)}
          className="inline-flex items-center justify-center rounded-full bg-violet-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400"
        >
          Explore relationship funnel →
        </Link>
      </div>
    );
  }

  if (step.step === 4) {
    return (
      <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
          {journey.subtitle}
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed">
          Follow Scott Weller — relationship origin, show-night vs post-show value, and what happened
          after Brooklyn.
        </p>
      </div>
    );
  }

  if (step.step === 5) {
    return (
      <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
          {journey.subtitle}
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed">
          Create a Brooklyn Encore Drop for connected fans — audience, product and 48-hour window
          are prefilled. Preview, then publish through the real drop engine.
        </p>
      </div>
    );
  }

  if (step.keyMessage) {
    return (
      <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
          {journey.subtitle}
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{step.keyMessage}</p>
      </div>
    );
  }

  return null;
}

function DemoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
