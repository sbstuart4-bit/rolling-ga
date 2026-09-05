"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEMO_SCENARIO_PRESETS,
  type DemoScenarioPreset,
} from "@/lib/demo-scenario/presets";
import { DEMO_SHOWS, listDemoShowsForArtist } from "@/lib/demo-scenario/shows";
import { DEMO_TIME_PHASE_LABELS } from "@/lib/demo-scenario/time-phases";
import {
  DEMO_ARTISTS,
  DEMO_FAN_HISTORY,
  DEMO_FAN_STATES,
  DEMO_LOCATION_STATES,
  DEMO_MERCH_RULES,
  DEMO_PURCHASE_HISTORY,
  DEMO_TIME_PHASES,
  type DemoArtistKey,
  type DemoScenario,
} from "@/lib/demo-scenario/types";
import {
  DEMO_ARTIST_LABELS,
  DEMO_FAN_HISTORY_LABELS,
  DEMO_FAN_STATE_LABELS,
  DEMO_LOCATION_LABELS,
  DEMO_MERCH_RULE_LABELS,
  DEMO_PURCHASE_HISTORY_LABELS,
  demoScenarioWithArtist,
} from "@/lib/demo-scenario/url";
import {
  merchExperienceDiagnosticLabel,
  resolveMerchExperience,
} from "@/lib/merch-experience/resolver";
import { resolveTimePhaseDate } from "@/lib/demo-scenario/time-phases";
import {
  enterDemoExperienceAction,
  resetDemoScenarioAction,
  runDemoScenarioPresetAction,
  updateDemoScenarioAction,
} from "@/server/demo/scenario-actions";

function SelectField({
  id,
  label,
  name,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DemoScenarioControls({
  initialScenario,
  boardAccess,
}: {
  initialScenario: DemoScenario;
  boardAccess: boolean;
}) {
  const [scenario, setScenario] = React.useState(initialScenario);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);

  const show = DEMO_SHOWS.find((s) => s.key === scenario.showKey) ?? DEMO_SHOWS[0]!;
  const simulatedNow = resolveTimePhaseDate(show, scenario.timePhase);
  const experience = resolveMerchExperience({
    now: simulatedNow,
    show,
    timePhase: scenario.timePhase,
    fanState: scenario.fanState,
    location: scenario.location,
    fanHistory: scenario.fanHistory,
    purchaseHistory: scenario.purchaseHistory,
    merchRule: scenario.merchRule,
  });

  function update(partial: Partial<DemoScenario>) {
    setScenario((prev) => ({ ...prev, ...partial }));
  }

  function onArtistChange(artist: DemoArtistKey) {
    setScenario(demoScenarioWithArtist(artist, scenario));
  }

  const showOptions = listDemoShowsForArtist(scenario.artist).map((s) => ({
    value: s.key,
    label: s.city,
  }));

  function ScenarioForm({ action, children }: { action: (fd: FormData) => void; children: React.ReactNode }) {
    return (
      <form
        action={(fd) => startTransition(() => action(fd))}
        className="space-y-5"
      >
        <input type="hidden" name="artist" value={scenario.artist} />
        <input type="hidden" name="showKey" value={scenario.showKey} />
        <input type="hidden" name="timePhase" value={scenario.timePhase} />
        <input type="hidden" name="fanState" value={scenario.fanState} />
        <input type="hidden" name="location" value={scenario.location} />
        <input type="hidden" name="fanHistory" value={scenario.fanHistory} />
        <input type="hidden" name="purchaseHistory" value={scenario.purchaseHistory} />
        <input type="hidden" name="merchRule" value={scenario.merchRule} />
        {children}
      </form>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="eyebrow text-muted-foreground">Experience scenario</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure artist, show, time, fan state, and location — then enter the real fan experience.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="scenario-artist"
          label="Artist"
          name="artist"
          value={scenario.artist}
          options={DEMO_ARTISTS.map((a) => ({ value: a, label: DEMO_ARTIST_LABELS[a] }))}
          onChange={(v) => onArtistChange(v as DemoArtistKey)}
        />
        <SelectField
          id="scenario-show"
          label="Show"
          name="showKey"
          value={scenario.showKey}
          options={showOptions}
          onChange={(v) => update({ showKey: v })}
        />
        <SelectField
          id="scenario-phase"
          label="Time relative to show"
          name="timePhase"
          value={scenario.timePhase}
          options={DEMO_TIME_PHASES.map((p) => ({ value: p, label: DEMO_TIME_PHASE_LABELS[p] }))}
          onChange={(v) => update({ timePhase: v as DemoScenario["timePhase"] })}
        />
        <SelectField
          id="scenario-fan"
          label="Fan state"
          name="fanState"
          value={scenario.fanState}
          options={DEMO_FAN_STATES.map((s) => ({ value: s, label: DEMO_FAN_STATE_LABELS[s] }))}
          onChange={(v) => update({ fanState: v as DemoScenario["fanState"] })}
        />
        <SelectField
          id="scenario-location"
          label="Location"
          name="location"
          value={scenario.location}
          options={DEMO_LOCATION_STATES.map((l) => ({ value: l, label: DEMO_LOCATION_LABELS[l] }))}
          onChange={(v) => update({ location: v as DemoScenario["location"] })}
        />
        <SelectField
          id="scenario-history"
          label="Fan history"
          name="fanHistory"
          value={scenario.fanHistory}
          options={DEMO_FAN_HISTORY.map((h) => ({ value: h, label: DEMO_FAN_HISTORY_LABELS[h] }))}
          onChange={(v) => update({ fanHistory: v as DemoScenario["fanHistory"] })}
        />
        <SelectField
          id="scenario-purchases"
          label="Purchase history"
          name="purchaseHistory"
          value={scenario.purchaseHistory}
          options={DEMO_PURCHASE_HISTORY.map((p) => ({ value: p, label: DEMO_PURCHASE_HISTORY_LABELS[p] }))}
          onChange={(v) => update({ purchaseHistory: v as DemoScenario["purchaseHistory"] })}
        />
        <SelectField
          id="scenario-merch"
          label="Merch rule"
          name="merchRule"
          value={scenario.merchRule}
          options={DEMO_MERCH_RULES.map((m) => ({ value: m, label: DEMO_MERCH_RULE_LABELS[m] }))}
          onChange={(v) => update({ merchRule: v as DemoScenario["merchRule"] })}
        />
      </div>

      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          Expected experience
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Artist</dt>
            <dd className="font-medium">{show.artistName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Show</dt>
            <dd className="font-medium">{show.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time</dt>
            <dd className="font-medium">{DEMO_TIME_PHASE_LABELS[scenario.timePhase]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fan</dt>
            <dd className="font-medium">{DEMO_FAN_STATE_LABELS[scenario.fanState]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="font-medium">{DEMO_LOCATION_LABELS[scenario.location]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Merch state</dt>
            <dd className="font-medium">{merchExperienceDiagnosticLabel(experience)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Primary message</dt>
            <dd className="font-medium">{experience.primaryMessage || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Why</dt>
            <dd className="text-muted-foreground">{experience.reason}</dd>
          </div>
        </dl>
        {experience.merchOverrideActive && (
          <p className="mt-3 text-xs font-medium text-amber-600">
            Manual merch override active — not normal product behavior.
          </p>
        )}
      </div>

      <ScenarioForm action={updateDemoScenarioAction}>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            Apply scenario
          </Button>
        </div>
      </ScenarioForm>

      {boardAccess && (
        <ScenarioForm action={enterDemoExperienceAction}>
          <Button type="submit" className="h-11 w-full bg-primary uppercase tracking-wider hover:bg-primary/90" disabled={pending}>
            Enter experience
          </Button>
        </ScenarioForm>
      )}

      <form action={(fd) => startTransition(() => resetDemoScenarioAction())}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          Reset scenario
        </Button>
      </form>

      <div className="space-y-3 border-t border-border pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Quick-launch scenarios
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DEMO_SCENARIO_PRESETS.map((preset) => (
            <PresetCard key={preset.id} preset={preset} disabled={!boardAccess || pending} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PresetCard({ preset, disabled }: { preset: DemoScenarioPreset; disabled: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/50 p-4 text-left">
      <div>
        <p className="font-medium">{preset.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
      </div>
      <form action={runDemoScenarioPresetAction}>
        <input type="hidden" name="presetId" value={preset.id} />
        <Button type="submit" size="sm" className="w-full" disabled={disabled}>
          {preset.buttonLabel}
        </Button>
      </form>
    </div>
  );
}
