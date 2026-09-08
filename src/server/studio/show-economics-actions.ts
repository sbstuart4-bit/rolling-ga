"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { eventShowEconomics, events } from "@/db/schema";
import {
  validatePhysicalBaselineInput,
  type VenueCommissionTreatment,
} from "@/lib/show-economics";
import { DEFAULT_ROLLING_GA_PLATFORM_FEE_BPS } from "@/lib/show-economics/marisol-brooklyn-fixture";
import { assertArtistAccess } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { getEventById } from "@/server/events/queries";

function parseTreatment(raw: string): VenueCommissionTreatment {
  if (raw === "INCLUDED" || raw === "EXCLUDED" || raw === "UNKNOWN") return raw;
  return "UNKNOWN";
}

function parseOptionalInt(raw: FormDataEntryValue | null): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const value = Number.parseInt(String(raw), 10);
  return Number.isFinite(value) ? value : null;
}

function parseOptionalMoney(raw: FormDataEntryValue | null): number | null {
  if (raw == null || String(raw).trim() === "") return null;
  const dollars = Number.parseFloat(String(raw));
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}

export type SaveShowEconomicsResult = { ok: true } | { ok: false; errors: Record<string, string> };

export async function saveShowEconomicsBaselineAction(
  _prevState: SaveShowEconomicsResult,
  formData: FormData,
): Promise<SaveShowEconomicsResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, errors: { form: "Not signed in" } };

  const eventId = String(formData.get("eventId") ?? "");
  const event = await getEventById(eventId);
  if (!event) return { ok: false, errors: { form: "Show not found" } };

  assertArtistAccess(ctx, event.artistId);

  const physical = {
    physicalMerchGmvCents: parseOptionalMoney(formData.get("physicalMerchGmv")),
    unitsBrought: parseOptionalInt(formData.get("unitsBrought")),
    unitsSold: parseOptionalInt(formData.get("unitsSold")),
    stockoutCount: parseOptionalInt(formData.get("stockoutCount")),
    venueCommissionTreatment: parseTreatment(String(formData.get("physicalVenueTreatment") ?? "UNKNOWN")),
    venueCommissionPercent: parseOptionalInt(formData.get("physicalVenueCommissionPercent")),
    laborCostCents: parseOptionalMoney(formData.get("laborCost")),
    otherPhysicalCostCents: parseOptionalMoney(formData.get("otherPhysicalCost")),
    physicalProductCostCents: parseOptionalMoney(formData.get("physicalProductCost")),
  };

  const validation = validatePhysicalBaselineInput(physical);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const digitalTreatment = parseTreatment(
    String(formData.get("digitalVenueTreatment") ?? "UNKNOWN"),
  );
  const digitalPercent = parseOptionalInt(formData.get("digitalVenueCommissionPercent"));

  const [eventMeta] = await db
    .select({ isDemo: events.isDemo })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  await db
    .insert(eventShowEconomics)
    .values({
      eventId,
      platformFeeBasisPoints: DEFAULT_ROLLING_GA_PLATFORM_FEE_BPS,
      digitalVenueCommissionTreatment: digitalTreatment,
      digitalVenueCommissionPercent: digitalPercent,
      physicalMerchGmvCents: physical.physicalMerchGmvCents,
      unitsBrought: physical.unitsBrought,
      unitsSold: physical.unitsSold,
      stockoutCount: physical.stockoutCount,
      physicalVenueCommissionTreatment: physical.venueCommissionTreatment,
      physicalVenueCommissionPercent: physical.venueCommissionPercent,
      laborCostCents: physical.laborCostCents,
      otherPhysicalCostCents: physical.otherPhysicalCostCents,
      physicalProductCostCents: physical.physicalProductCostCents,
      isDemo: eventMeta?.isDemo ?? false,
    })
    .onConflictDoUpdate({
      target: eventShowEconomics.eventId,
      set: {
        digitalVenueCommissionTreatment: digitalTreatment,
        digitalVenueCommissionPercent: digitalPercent,
        physicalMerchGmvCents: physical.physicalMerchGmvCents,
        unitsBrought: physical.unitsBrought,
        unitsSold: physical.unitsSold,
        stockoutCount: physical.stockoutCount,
        physicalVenueCommissionTreatment: physical.venueCommissionTreatment,
        physicalVenueCommissionPercent: physical.venueCommissionPercent,
        laborCostCents: physical.laborCostCents,
        otherPhysicalCostCents: physical.otherPhysicalCostCents,
        physicalProductCostCents: physical.physicalProductCostCents,
      },
    });

  revalidatePath(`/studio/insights/economics/${eventId}`);
  revalidatePath("/studio/insights");
  return { ok: true };
}
