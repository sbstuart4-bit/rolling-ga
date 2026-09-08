"use client";

import { useActionState } from "react";
import type { PhysicalBaselineInput, ShowEconomicsConfig } from "@/lib/show-economics/types";
import {
  saveShowEconomicsBaselineAction,
  type SaveShowEconomicsResult,
} from "@/server/studio/show-economics-actions";

const initialState: SaveShowEconomicsResult = { ok: true };

function centsToInput(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export function ShowEconomicsBaselineForm({
  eventId,
  physical,
  config,
}: {
  eventId: string;
  physical: PhysicalBaselineInput;
  config: ShowEconomicsConfig;
}) {
  const [state, action] = useActionState<SaveShowEconomicsResult, FormData>(
    saveShowEconomicsBaselineAction,
    initialState,
  );
  const errors = state.ok ? {} : state.errors;

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-300">
          Physical baseline inputs
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Enter booth-level numbers from the venue or merch manager. Rolling GA metrics stay
          derived from orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Physical merch GMV ($)"
          name="physicalMerchGmv"
          defaultValue={centsToInput(physical.physicalMerchGmvCents)}
          error={errors.physicalMerchGmvCents}
        />
        <Field
          label="Units brought"
          name="unitsBrought"
          type="number"
          defaultValue={physical.unitsBrought ?? ""}
          error={errors.unitsBrought}
        />
        <Field
          label="Units sold"
          name="unitsSold"
          type="number"
          defaultValue={physical.unitsSold ?? ""}
          error={errors.unitsSold}
        />
        <Field
          label="Stockout count"
          name="stockoutCount"
          type="number"
          defaultValue={physical.stockoutCount ?? ""}
          error={errors.stockoutCount}
        />
        <SelectField
          label="Physical venue commission"
          name="physicalVenueTreatment"
          defaultValue={physical.venueCommissionTreatment}
        />
        <Field
          label="Physical commission % (if included)"
          name="physicalVenueCommissionPercent"
          type="number"
          defaultValue={physical.venueCommissionPercent ?? ""}
          error={errors.venueCommissionPercent}
        />
        <Field
          label="Labor cost ($)"
          name="laborCost"
          defaultValue={centsToInput(physical.laborCostCents)}
          error={errors.laborCostCents}
        />
        <Field
          label="Other physical costs ($)"
          name="otherPhysicalCost"
          defaultValue={centsToInput(physical.otherPhysicalCostCents)}
          error={errors.otherPhysicalCostCents}
        />
        <Field
          label="Physical product cost / COGS ($)"
          name="physicalProductCost"
          defaultValue={centsToInput(physical.physicalProductCostCents)}
        />
      </div>

      <div className="border-t border-white/10 pt-5">
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Digital channel venue treatment
        </h4>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Rolling GA venue commission"
            name="digitalVenueTreatment"
            defaultValue={config.digitalVenueCommissionTreatment}
          />
          <Field
            label="Digital commission % (if included)"
            name="digitalVenueCommissionPercent"
            type="number"
            defaultValue={config.digitalVenueCommissionPercent ?? ""}
          />
        </div>
      </div>

      <input type="hidden" name="eventId" value={eventId} />

      {errors.form ? <p className="text-sm text-red-400">{errors.form}</p> : null}

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-violet-500 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400"
      >
        Save baseline
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-300">{label}</span>
      <input
        name={name}
        type={type}
        step={type === "number" ? "1" : undefined}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-violet-500/50"
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-300">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-violet-500/50"
      >
        <option value="UNKNOWN">Unknown — not confirmed</option>
        <option value="INCLUDED">Included in venue commission</option>
        <option value="EXCLUDED">Excluded from venue commission</option>
      </select>
    </label>
  );
}
