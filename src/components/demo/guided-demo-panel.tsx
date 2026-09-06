"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuidedDemoJourney, GuidedDemoStep, GuidedDemoSession } from "@/lib/guided-demo";
import { cn } from "@/lib/utils";
import {
  exitGuidedDemoAction,
  guidedDemoGoToStepAction,
  guidedDemoNextAction,
  guidedDemoPrevAction,
  toggleGuidedDemoAutoplayAction,
  toggleGuidedDemoPresenterAction,
} from "@/server/demo/guided-demo-actions";
import { ensureGuidedDemoFromUrlAction } from "@/server/demo/guided-demo-sync-action";

const AUTOPLAY_MS = 25_000;

interface GuidedDemoPanelProps {
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
}

export function GuidedDemoPanel({
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
}: GuidedDemoPanelProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
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

  React.useEffect(() => {
    if (!session.autoplay || paused) return;
    const timer = window.setTimeout(() => {
      const form = document.getElementById("guided-demo-next-form") as HTMLFormElement | null;
      form?.requestSubmit();
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [session.autoplay, paused, session.step]);

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

  return (
    <aside
      className={cn(
        "guided-demo-panel flex flex-col border-border bg-[#0f0f10] text-foreground",
        "w-full shrink-0 border-t md:max-h-[min(52rem,calc(100dvh-2rem))] md:w-full md:overflow-hidden md:rounded-2xl md:border md:border-border/80",
      )}
      aria-label="Guided demo narration"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Guided demo
          </p>
          <p className="truncate text-sm font-medium">{journey.title}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          >
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
          <form action={exitGuidedDemoAction}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Exit guided demo">
              <X className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Step {step.step} of {totalSteps}
              </p>
              <h2 className="mt-1 font-display text-xl tracking-wide">{step.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Access: {accessLabel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span className="rounded-full border border-border/70 px-2 py-0.5">{timeLabel}</span>
                <span className="rounded-full border border-border/70 px-2 py-0.5">{fanLabel}</span>
                <span className="rounded-full border border-border/70 px-2 py-0.5">{locationLabel}</span>
                <span className="rounded-full border border-border/70 px-2 py-0.5">{credentialLabel}</span>
                <span className="rounded-full border border-border/70 px-2 py-0.5">{purchaseLabel}</span>
              </div>
            </div>

            <GuidedDemoStepRail
              journeyId={session.journeyId}
              steps={journey.steps}
              currentStep={step.step}
            />

            <NarrationBlock label="What the fan sees" body={step.whatFanSees} />
            <NarrationBlock label="What changed" body={step.whatChanged} />
            <NarrationBlock label="Why it matters" body={step.whyItMatters} />

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
                <PresenterHint label="Say" body={step.presenter.say} />
                <PresenterHint label="Point out" body={step.presenter.pointOut} />
                <PresenterHint label="Next" body={step.presenter.next} />
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-border/60 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <form action={guidedDemoPrevAction} className="flex-1 sm:flex-none">
                <input type="hidden" name="journeyId" value={session.journeyId} />
                <input type="hidden" name="step" value={String(session.step)} />
                <Button
                  type="submit"
                  variant="secondary"
                  className="h-10 w-full uppercase tracking-wider sm:w-auto"
                  disabled={step.step <= 1}
                >
                  ← Previous
                </Button>
              </form>

              <form
                id="guided-demo-next-form"
                action={guidedDemoNextAction}
                className="flex-1 sm:flex-none"
              >
                <input type="hidden" name="journeyId" value={session.journeyId} />
                <input type="hidden" name="step" value={String(session.step)} />
                <Button
                  type="submit"
                  className="h-10 w-full uppercase tracking-wider sm:w-auto"
                  disabled={step.step >= totalSteps}
                >
                  Next →
                </Button>
              </form>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 text-xs uppercase tracking-wider"
                onClick={() => {
                  if (session.autoplay) setPaused((p) => !p);
                  else void toggleAutoplay();
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
                onClick={() => void togglePresenter()}
              >
                {session.presenter ? "Presenter on" : "Presenter off"}
              </Button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function NarrationBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

function PresenterHint({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{body}</p>
    </div>
  );
}

function GuidedDemoStepRail({
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
