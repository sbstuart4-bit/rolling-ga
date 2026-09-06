"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuidedDemoJourney, GuidedDemoStep, GuidedDemoSession } from "@/lib/guided-demo";
import { cn } from "@/lib/utils";
import {
  guidedDemoGoToStepAction,
  guidedDemoNextAction,
  guidedDemoPrevAction,
  toggleGuidedDemoAutoplayAction,
  toggleGuidedDemoPresenterAction,
} from "@/server/demo/guided-demo-actions";
import { ensureGuidedDemoFromUrlAction } from "@/server/demo/guided-demo-sync-action";

export const GUIDED_DEMO_AUTOPLAY_MS = 25_000;

export type GuidedDemoChromeProps = {
  journey: GuidedDemoJourney;
  step: GuidedDemoStep;
  session: GuidedDemoSession;
  totalSteps: number;
  accessLabel: string;
  timeLabel: string;
  fanLabel: string;
  locationLabel: string;
  credentialLabel: string;
  purchaseLabel: string;
};

export function useGuidedDemoUrlSync() {
  const [synced, setSynced] = React.useState(false);

  React.useEffect(() => {
    if (synced) return;
    const params = new URLSearchParams(window.location.search);
    const guided = params.get("guided");
    const stepParam = params.get("step");
    if (!guided || !stepParam) {
      setSynced(true);
      return;
    }
    void ensureGuidedDemoFromUrlAction({
      guided,
      step: stepParam,
      presenter: params.get("presenter") === "1" ? "1" : "0",
      autoplay: params.get("autoplay") === "1" ? "1" : "0",
    }).finally(() => setSynced(true));
  }, [synced]);
}

export function useGuidedDemoAutoplay(session: GuidedDemoSession, paused: boolean) {
  React.useEffect(() => {
    if (!session.autoplay || paused) return;
    const timer = window.setTimeout(() => {
      const form = document.getElementById("guided-demo-next-form") as HTMLFormElement | null;
      form?.requestSubmit();
    }, GUIDED_DEMO_AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [session.autoplay, paused, session.step]);
}

export function useGuidedDemoToggles(session: GuidedDemoSession) {
  const toggleAutoplay = async () => {
    const formData = new FormData();
    formData.set("journeyId", session.journeyId);
    formData.set("step", String(session.step));
    formData.set("autoplay", session.autoplay ? "0" : "1");
    await toggleGuidedDemoAutoplayAction(formData);
  };

  const togglePresenter = async () => {
    const formData = new FormData();
    formData.set("journeyId", session.journeyId);
    formData.set("step", String(session.step));
    formData.set("presenter", session.presenter ? "0" : "1");
    await toggleGuidedDemoPresenterAction(formData);
  };

  return { toggleAutoplay, togglePresenter };
}

export function GuidedDemoStateChips({
  timeLabel,
  fanLabel,
  locationLabel,
  credentialLabel,
  purchaseLabel,
}: Pick<
  GuidedDemoChromeProps,
  "timeLabel" | "fanLabel" | "locationLabel" | "credentialLabel" | "purchaseLabel"
>) {
  return (
    <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      <span className="rounded-full border border-border/70 px-2 py-0.5">{timeLabel}</span>
      <span className="rounded-full border border-border/70 px-2 py-0.5">{fanLabel}</span>
      <span className="rounded-full border border-border/70 px-2 py-0.5">{locationLabel}</span>
      <span className="rounded-full border border-border/70 px-2 py-0.5">{credentialLabel}</span>
      <span className="rounded-full border border-border/70 px-2 py-0.5">{purchaseLabel}</span>
    </div>
  );
}

export function GuidedDemoNarrationBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

export function GuidedDemoPresenterHint({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{body}</p>
    </div>
  );
}

export function GuidedDemoStepRail({
  journeyId,
  steps,
  currentStep,
}: {
  journeyId: GuidedDemoSession["journeyId"];
  steps: GuidedDemoStep[];
  currentStep: number;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Jump to step
      </p>
      <ol className="mt-2 grid gap-1">
        {steps.map((journeyStep) => {
          const active = journeyStep.step === currentStep;
          return (
            <li key={journeyStep.step}>
              <form action={guidedDemoGoToStepAction}>
                <input type="hidden" name="journeyId" value={journeyId} />
                <input type="hidden" name="step" value={String(journeyStep.step)} />
                <button
                  type="submit"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                    active
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/60 bg-card/30 text-muted-foreground hover:border-border hover:bg-card/60 hover:text-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      active ? "bg-primary text-primary-foreground" : "bg-secondary",
                    )}
                  >
                    {journeyStep.step}
                  </span>
                  <span className="min-w-0 truncate font-medium">{journeyStep.title}</span>
                </button>
              </form>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function GuidedDemoStepNav({
  session,
  step,
  totalSteps,
  compact = false,
}: {
  session: GuidedDemoSession;
  step: GuidedDemoStep;
  totalSteps: number;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", compact ? "w-full" : "flex-wrap")}>
      <form action={guidedDemoPrevAction} className={compact ? "flex-1" : "flex-1 sm:flex-none"}>
        <input type="hidden" name="journeyId" value={session.journeyId} />
        <input type="hidden" name="step" value={String(session.step)} />
        <Button
          type="submit"
          variant="secondary"
          className={cn(
            "uppercase tracking-wider",
            compact ? "h-9 w-full text-[10px]" : "h-10 w-full sm:w-auto",
          )}
          disabled={step.step <= 1}
        >
          ← Previous
        </Button>
      </form>

      <form
        id="guided-demo-next-form"
        action={guidedDemoNextAction}
        className={compact ? "flex-1" : "flex-1 sm:flex-none"}
      >
        <input type="hidden" name="journeyId" value={session.journeyId} />
        <input type="hidden" name="step" value={String(session.step)} />
        <Button
          type="submit"
          className={cn(
            "uppercase tracking-wider",
            compact ? "h-9 w-full text-[10px]" : "h-10 w-full sm:w-auto",
          )}
          disabled={step.step >= totalSteps}
        >
          Next →
        </Button>
      </form>
    </div>
  );
}

export function GuidedDemoAuxControls({
  session,
  paused,
  onPauseToggle,
  onAutoplayToggle,
  onPresenterToggle,
}: {
  session: GuidedDemoSession;
  paused: boolean;
  onPauseToggle: () => void;
  onAutoplayToggle: () => void;
  onPresenterToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-9 flex-1 text-xs uppercase tracking-wider"
        onClick={() => {
          if (session.autoplay) onPauseToggle();
          else void onAutoplayToggle();
        }}
      >
        {session.autoplay && !paused ? (
          <>
            <Pause className="mr-1.5 size-3.5" /> Pause
          </>
        ) : session.autoplay && paused ? (
          <>
            <Play className="mr-1.5 size-3.5" /> Resume
          </>
        ) : (
          <>
            <Play className="mr-1.5 size-3.5" /> Auto play
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-9 flex-1 text-xs uppercase tracking-wider"
        onClick={() => void onPresenterToggle()}
      >
        {session.presenter ? "Presenter on" : "Presenter off"}
      </Button>
    </div>
  );
}

export function GuidedDemoDetailContent({
  journey,
  step,
  session,
  totalSteps,
  accessLabel,
  timeLabel,
  fanLabel,
  locationLabel,
  credentialLabel,
  purchaseLabel,
  showStepNav = false,
  showAuxControls = false,
  paused = false,
  onPauseToggle,
  onAutoplayToggle,
  onPresenterToggle,
}: GuidedDemoChromeProps & {
  showStepNav?: boolean;
  showAuxControls?: boolean;
  paused?: boolean;
  onPauseToggle?: () => void;
  onAutoplayToggle?: () => void;
  onPresenterToggle?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Step {step.step} of {totalSteps}
        </p>
        <h2 className="mt-1 font-display text-xl tracking-wide">{step.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Access: {accessLabel}</p>
        <div className="mt-2">
          <GuidedDemoStateChips
            timeLabel={timeLabel}
            fanLabel={fanLabel}
            locationLabel={locationLabel}
            credentialLabel={credentialLabel}
            purchaseLabel={purchaseLabel}
          />
        </div>
      </div>

      <GuidedDemoStepRail
        journeyId={session.journeyId}
        steps={journey.steps}
        currentStep={step.step}
      />

      <GuidedDemoNarrationBlock label="What the fan sees" body={step.whatFanSees} />
      <GuidedDemoNarrationBlock label="What changed" body={step.whatChanged} />
      <GuidedDemoNarrationBlock label="Why it matters" body={step.whyItMatters} />

      {step.presenterNote ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/90">
            Presenter note
          </p>
          <p className="mt-1 text-sm text-amber-50/90">{step.presenterNote}</p>
        </div>
      ) : null}

      {session.presenter && step.presenter ? (
        <div className="space-y-3 rounded-lg border border-border/80 bg-card/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Presenter mode
          </p>
          <GuidedDemoPresenterHint label="Say" body={step.presenter.say} />
          <GuidedDemoPresenterHint label="Point out" body={step.presenter.pointOut} />
          <GuidedDemoPresenterHint label="Next" body={step.presenter.next} />
        </div>
      ) : null}

      {showStepNav ? (
        <GuidedDemoStepNav session={session} step={step} totalSteps={totalSteps} />
      ) : null}

      {showAuxControls && onPauseToggle && onAutoplayToggle && onPresenterToggle ? (
        <GuidedDemoAuxControls
          session={session}
          paused={paused}
          onPauseToggle={onPauseToggle}
          onAutoplayToggle={onAutoplayToggle}
          onPresenterToggle={onPresenterToggle}
        />
      ) : null}
    </div>
  );
}
