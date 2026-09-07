"use client";

import * as React from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ArtistGuidedDemoJourney,
  ArtistGuidedDemoStep,
  ArtistGuidedDemoSession,
} from "@/lib/artist-guided-demo";
import { cn } from "@/lib/utils";
import {
  artistGuidedDemoGoToStepAction,
  artistGuidedDemoNextAction,
  artistGuidedDemoPrevAction,
  completeArtistGuidedDemoAction,
  exitArtistGuidedDemoAction,
  toggleArtistGuidedDemoAutoplayAction,
  toggleArtistGuidedDemoPresenterAction,
} from "@/server/demo/artist-guided-demo-actions";
import { ensureArtistGuidedDemoFromUrlAction } from "@/server/demo/artist-guided-demo-sync-action";

export const ARTIST_GUIDED_DEMO_AUTOPLAY_MS = 25_000;

export type ArtistGuidedDemoChromeProps = {
  journey: ArtistGuidedDemoJourney;
  step: ArtistGuidedDemoStep;
  session: ArtistGuidedDemoSession;
  totalSteps: number;
  timeLabel: string;
  showLabel: string;
};

export function useArtistGuidedDemoUrlSync() {
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
    void ensureArtistGuidedDemoFromUrlAction({
      guided,
      step: stepParam,
      presenter: params.get("presenter") === "1" ? "1" : "0",
      autoplay: params.get("autoplay") === "1" ? "1" : "0",
    }).finally(() => setSynced(true));
  }, [synced]);
}

export function useArtistGuidedDemoAutoplay(session: ArtistGuidedDemoSession, paused: boolean) {
  React.useEffect(() => {
    if (!session.autoplay || paused) return;
    const timer = window.setTimeout(() => {
      const form = document.getElementById("artist-guided-demo-next-form") as HTMLFormElement | null;
      form?.requestSubmit();
    }, ARTIST_GUIDED_DEMO_AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [session.autoplay, paused, session.step]);
}

export function useArtistGuidedDemoToggles(session: ArtistGuidedDemoSession) {
  const toggleAutoplay = async () => {
    const formData = new FormData();
    formData.set("journeyId", session.journeyId);
    formData.set("step", String(session.step));
    formData.set("autoplay", session.autoplay ? "0" : "1");
    await toggleArtistGuidedDemoAutoplayAction(formData);
  };

  const togglePresenter = async () => {
    const formData = new FormData();
    formData.set("journeyId", session.journeyId);
    formData.set("step", String(session.step));
    formData.set("presenter", session.presenter ? "0" : "1");
    await toggleArtistGuidedDemoPresenterAction(formData);
  };

  return { toggleAutoplay, togglePresenter };
}

function ArtistGuidedDemoNarrationBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

function ArtistGuidedDemoPresenterHint({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{body}</p>
    </div>
  );
}

export function ArtistGuidedDemoStepRail({
  journeyId,
  steps,
  currentStep,
}: {
  journeyId: ArtistGuidedDemoSession["journeyId"];
  steps: ArtistGuidedDemoStep[];
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
              <form action={artistGuidedDemoGoToStepAction}>
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

export function ArtistGuidedDemoStepNav({
  session,
  step,
  totalSteps,
  compact = false,
}: {
  session: ArtistGuidedDemoSession;
  step: ArtistGuidedDemoStep;
  totalSteps: number;
  compact?: boolean;
}) {
  const nextLabel = step.nextCta ?? "Next →";

  if (step.isConclusion) {
    return (
      <div className={cn("flex flex-col gap-2", compact ? "w-full" : "")}>
        <form action={completeArtistGuidedDemoAction}>
          <Button
            type="submit"
            className={cn(
              "w-full uppercase tracking-wider",
              compact ? "h-9 text-[10px]" : "h-10 text-xs",
            )}
          >
            Explore Artist Studio
          </Button>
        </form>
        <Button
          asChild
          variant="outline"
          className={cn(
            "w-full uppercase tracking-wider",
            compact ? "h-9 text-[10px]" : "h-10 text-xs",
          )}
        >
          <Link href="/pilot#conversation">Run a pilot</Link>
        </Button>
        <form action={artistGuidedDemoPrevAction}>
          <input type="hidden" name="journeyId" value={session.journeyId} />
          <input type="hidden" name="step" value={String(session.step)} />
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "w-full uppercase tracking-wider",
              compact ? "h-9 text-[10px]" : "h-10 text-xs",
            )}
          >
            ← Back
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", compact ? "w-full" : "flex-wrap")}>
      <form action={artistGuidedDemoPrevAction} className={compact ? "flex-1" : "flex-1 sm:flex-none"}>
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
          ← Back
        </Button>
      </form>

      <form
        id="artist-guided-demo-next-form"
        action={artistGuidedDemoNextAction}
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
          {nextLabel}
        </Button>
      </form>
    </div>
  );
}

export function ArtistGuidedDemoAuxControls({
  session,
  paused,
  onPauseToggle,
  onAutoplayToggle,
  onPresenterToggle,
}: {
  session: ArtistGuidedDemoSession;
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

export function ArtistGuidedDemoDetailContent({
  journey,
  step,
  session,
  totalSteps,
  timeLabel,
  showLabel,
  showStepNav = false,
  showAuxControls = false,
  paused = false,
  onPauseToggle,
  onAutoplayToggle,
  onPresenterToggle,
}: ArtistGuidedDemoChromeProps & {
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
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="rounded-full border border-border/70 px-2 py-0.5">{timeLabel}</span>
          <span className="rounded-full border border-border/70 px-2 py-0.5">{showLabel}</span>
        </div>
      </div>

      {step.keyMessage ? (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5">
          <p className="text-sm font-medium leading-snug text-violet-100">{step.keyMessage}</p>
        </div>
      ) : null}

      <ArtistGuidedDemoStepRail
        journeyId={session.journeyId}
        steps={journey.steps}
        currentStep={step.step}
      />

      <ArtistGuidedDemoNarrationBlock label="What the artist sees" body={step.whatArtistSees} />
      <ArtistGuidedDemoNarrationBlock label="What changed" body={step.whatChanged} />
      <ArtistGuidedDemoNarrationBlock label="Why it matters" body={step.whyItMatters} />

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
          <ArtistGuidedDemoPresenterHint label="Say" body={step.presenter.say} />
          <ArtistGuidedDemoPresenterHint label="Point out" body={step.presenter.pointOut} />
          <ArtistGuidedDemoPresenterHint label="Next" body={step.presenter.next} />
        </div>
      ) : null}

      {showStepNav ? (
        <ArtistGuidedDemoStepNav session={session} step={step} totalSteps={totalSteps} />
      ) : null}

      {showAuxControls && onPauseToggle && onAutoplayToggle && onPresenterToggle ? (
        <ArtistGuidedDemoAuxControls
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

export function ArtistGuidedDemoExitForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={exitArtistGuidedDemoAction}>
      <Button
        type="submit"
        variant="ghost"
        className={cn(
          "uppercase tracking-wider",
          compact ? "h-9 w-full text-[10px]" : "w-full text-xs",
        )}
      >
        Exit guided demo
      </Button>
    </form>
  );
}
