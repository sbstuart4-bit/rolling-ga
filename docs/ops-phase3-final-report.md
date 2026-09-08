# Rolling GA Ops — Phase 3 Final Report
## Pack + Carrier Handoff

**Status:** COMPLETE (functionality approved; QA artifacts captured)  
**Date:** September 7, 2026  
**Baseline at start:** 544/544 tests · typecheck · build passing  
**Baseline at close:** 555/555 tests · typecheck · build passing  

---

## 1. Audit findings

| Area | Finding |
|------|---------|
| **Orders** | Phase 5 already had `fulfillment_status`, `fulfillment_packed_at`, `fulfillment_shipped_at`, and commerce `status` (`packed`, `ready_to_ship`, `shipped`). No pack-start or handoff timestamps existed. |
| **Shipments** | `shipments` table already models carrier, service, tracking, `shipped_at`, `label_purchased`, and status (`pending`, `label_required`, `in_transit`, etc.). Reused — no second shipment system. |
| **Production (Phase 2)** | `production_work` provides unit-level completion. `deriveOrderProductionStatus().readyToPack` derives readiness when all on-demand units are complete. |
| **Ops Phase 1** | Command center, show detail, promise prioritization, and cross-show aggregation were in place and extended — not replaced. |
| **Existing pick-pack** | `/ops/pick-pack` was a read-only commerce-status stub. Phase 3 adds `/ops/packing` as the real operational destination. |
| **Carrier integration** | None. `label_purchased` remains `false`; demo carrier labels are explicitly marked DEMO. |

**Conclusion:** Packing/handoff required additive order timestamps and derived operational states — not new fulfillment enum values or a parallel shipment architecture.

---

## 2. Packing architecture decision

**Order-level packing** with **derived operational state** from timestamps + production completeness + exceptions.

New persisted fields on `orders` (migration `0008_pack_handoff.sql`):

| Column | Purpose |
|--------|---------|
| `packing_started_at` | Operator started packing |
| `ready_for_handoff_at` | Packed and staged for carrier transfer |
| `handed_to_carrier_at` | Physical custody transferred (distinct from shipped) |

Reused existing fields:

| Field | Purpose |
|-------|---------|
| `fulfillment_packed_at` | Pack complete milestone |
| `fulfillment_shipped_at` | Downstream shipped / in-transit (Phase 5) |
| `fulfillment_status` | `packed` / `shipped` (no new enum values) |
| Commerce `status` | `ready_to_ship` after pack; `shipped` only when actually shipped |

**Lib:** `src/lib/packing/` — readiness, priority, handoff timing, aggregation, types.

**Server:** `packing-queries.ts` (read), `packing-actions.ts` (mutations).

---

## 3. Shipment / handoff model decision

- **One shipment row per order** (existing pattern; `.limit(1)` in queries preserved).
- **Created/updated on MARK PACKED** with `status: pending`, demo carrier from `shippingMethodLabel` or `"Demo carrier"`.
- **Updated on HAND TO CARRIER** to `label_required` — does **not** set `shipped_at` or `in_transit`.
- **Seeded shipped orders** (Brooklyn/Nashville fulfillment) continue to set `shipped_at` + `in_transit` only when `fulfillment_status = shipped` — simulating downstream carrier movement separately from handoff.

---

## 4. Lifecycle definitions

| Operational state | Derivation |
|-------------------|------------|
| **BLOCKED** | Production incomplete, blocking exception, or invalid pack state |
| **READY TO PACK** | `canOrderEnterPacking()` true; no pack timestamps yet |
| **PACKING** | `packing_started_at` set; not yet packed |
| **PACKED** | `fulfillment_packed_at` set; `ready_for_handoff_at` not yet set |
| **READY FOR HANDOFF** | `ready_for_handoff_at` set; not handed |
| **HANDED TO CARRIER** | `handed_to_carrier_at` set; `fulfillment_shipped_at` null |
| **SHIPPED** | `fulfillment_shipped_at` or `fulfillment_status = shipped` |
| **DELIVERED** | `actual_delivered_at` or `fulfillment_status = delivered` |

**READY TO PACK** remains derived from Phase 2 production completeness where on-demand units exist; stocked/digital-only lines do not block packing.

---

## 5. Packed vs handed-to-carrier vs shipped

| Milestone | What it means | Persisted where |
|-----------|---------------|-----------------|
| **Packed** | Physical order packed | `fulfillment_packed_at`, `fulfillment_status = packed` |
| **Ready for handoff** | Staged for carrier pickup | `ready_for_handoff_at`, commerce `ready_to_ship` |
| **Handed to carrier** | Custody transferred; no carrier scan implied | `handed_to_carrier_at` only |
| **Shipped** | Downstream movement (seed/demo or future integration) | `fulfillment_shipped_at`, shipment `shipped_at`, `in_transit` |

**MARK PACKED** does not set `fulfillment_shipped_at`.  
**MARK HANDED TO CARRIER** does not set `fulfillment_shipped_at` or shipment `in_transit`.  
Order detail UI explicitly notes: *"Handed to carrier is not the same as shipped."*

---

## 6. Readiness rules

`canOrderEnterPacking(orderId)` (via `canOrderEnterPacking()` in `readiness.ts`):

- Production complete for all on-demand units (or no production rows for stocked-only)
- `fulfillment_status` in `received` | `production` | `exception`
- Not already packed, shipped, delivered, or cancelled
- No open **blocking** exception: `item_unavailable`, `address_issue`, `production_delay`

`canMarkHandedToCarrier()`:

- Packed / ready-for-handoff
- No blocking exception
- Not already handed or shipped

All checks are server-side in `packing-actions.ts`.

---

## 7. Handoff timing approach

**Internal handoff target** — not a carrier cutoff:

```
handoffTargetAt = promisedDeliveryAt − 18 hours
```

Labeled **"Handoff target"** / **"Internal handoff target"** in UI. No fabricated FedEx/UPS cutoff times.

---

## 8. Priority algorithm

Centralized in `src/lib/packing/priority.ts` (aligned with Phase 1/2 promise logic):

1. Past promise  
2. Blocking exception  
3. At risk  
4. Nearest promise deadline  
5. Normal queue age (`placedAt`)

`comparePackPriority()` used for **Must Leave Next** and queue ordering.

---

## 9. Blocked-order logic

- **BLOCKING_PACK_EXCEPTIONS:** `item_unavailable`, `address_issue`, `production_delay`
- Blocked orders appear in queue with `operationalState: blocked` and `blockedReason` text
- **BLOCKED** filter on `/ops/packing`
- `carrier_delay` does not block packing (Phase 5 exception reused as-is)
- No duplicate pack-exception system; no resolution workflow (Phase 4)

---

## 10. Packing Queue implementation

**Route:** `/ops/packing`

**Summary metrics:** Must leave next, ready to pack, packing, packed, ready for handoff, handed to carrier, at risk, blocked

**Sections:**
- **Must Leave Next** — high-signal amber banner + top 12 prioritized cards
- **By show** — cross-artist aggregation with link to filtered queue
- **Pack queue** — filterable full list

**Filters:** All · Ready to pack · Packing · Ready for handoff · Handed to carrier · Blocked · At risk

**Nav:** Command Center · Production · **Packing** · Orders · Exceptions

---

## 11. Pack / handoff actions

| Action | Effect | Idempotent |
|--------|--------|------------|
| **Start packing** | Sets `packing_started_at` | Yes (no-op if already started) |
| **Mark packed** | Sets `fulfillment_packed_at`, `ready_for_handoff_at`, `fulfillment_status = packed`, commerce `ready_to_ship`; creates/updates shipment `pending` | Yes |
| **Hand to carrier** | Sets `handed_to_carrier_at`; shipment → `label_required` | Yes |

Auth: `fulfillment_operator` | `rga_admin` only.  
Revalidates `/ops`, `/ops/packing`, `/ops/orders` after mutations.

---

## 12. Shipment persistence

On **Mark packed:**
- Upsert `shipments` row: `carrier`, `service`, optional `trackingNumber`, `status: pending`, `label_purchased: false`, `is_demo: true`
- `shipped_at` remains null

On **Hand to carrier:**
- Shipment `status → label_required`
- `shipped_at` still null

Downstream **shipped** state only from existing Brooklyn/Nashville fulfillment seed or future carrier integration.

---

## 13. Integrations

| Surface | Addition |
|---------|----------|
| **Command Center** (`/ops`) | Show cards: Pack + handoff block (ready to pack, ready for handoff, must leave) |
| **Show detail** (`/ops/shows/[eventId]`) | Pack + handoff summary + link to filtered pack queue |
| **Order detail** (`/ops/orders/[orderId]`) | Packing panel (timestamps, shipment, handoff note) + action buttons |
| **Production panel** | Unchanged from Phase 2 |

Phase 4 activation attribution preserved (activation drop badge on pack cards).  
Fan-facing order status unchanged.  
Artist Studio and Pilot Report reconciliation preserved via shared fulfillment fields.

---

## 14. Marisol demo pack/handoff story

After Brooklyn fulfillment + production work + `seedBrooklynPackHandoff`:

- Deterministic cycle across orders: ready to pack → packing → packed → ready for handoff → handed → shipped (demo)
- Mix includes show-night, post-show, and Encore activation orders (purple badge on cards)
- Brooklyn show card: **42 ready to pack**, **42 must leave** at demo clock (Jun 13, 10:00 AM post-show)

---

## 15. Multi-show story

Pack queue is cross-artist. At capture time:

| Show | Ready to pack | Must leave |
|------|---------------|------------|
| Marisol Reyes · Brooklyn | 42 | 42 |
| The Degens · Detroit | 23 | 23 |
| Nova Kestrel · Nashville | 1 | 1 |

Priority is promise-based across shows, not artist-based.

---

## 16. Files changed (Phase 3)

### Schema / migration
- `drizzle/0008_pack_handoff.sql`
- `drizzle/meta/_journal.json`
- `src/db/schema/commerce.ts`

### Lib
- `src/lib/packing/types.ts`
- `src/lib/packing/readiness.ts`
- `src/lib/packing/priority.ts`
- `src/lib/packing/handoff-timing.ts`
- `src/lib/packing/aggregate.ts`
- `src/lib/packing/index.ts`
- `src/lib/ops/types.ts` (packing pressure on show metrics)

### Server
- `src/server/ops/packing-queries.ts`
- `src/server/ops/packing-actions.ts`
- `src/server/ops/fulfillment-queries.ts` (packing pressure load)

### UI / routes
- `src/app/(ops)/ops/(fulfillment)/packing/page.tsx`
- `src/components/ops/ops-packing-queue.tsx`
- `src/components/ops/packing-order-actions.tsx`
- `src/components/ops/ops-order-packing-panel.tsx`
- `src/components/ops/ops-command-shell.tsx` (nav)
- `src/components/ops/ops-command-center.tsx`
- `src/components/ops/ops-show-detail.tsx`
- `src/app/(ops)/ops/(fulfillment)/orders/[orderId]/page.tsx`

### Seed
- `src/db/seed/pack-handoff.ts`
- `src/db/seed/index.ts`

### QA / docs
- `scripts/capture-ops-phase3-screenshots.mjs`
- `docs/ops-phase3-screenshots/` (40 images)
- `docs/ops-phase3-final-report.md`

### Tests
- `src/test/ops-packing-queue.test.ts`

---

## 17. Tests added

**`src/test/ops-packing-queue.test.ts`** — 11 tests:

- Packing readiness (production blocks pack)
- Priority ordering (past promise > at risk)
- Authorization (artist denied, fan denied)
- Full lifecycle: start pack → mark packed → hand to carrier
- Packed ≠ shipped (timestamps)
- Handed ≠ shipped
- Production incomplete blocks start
- Invalid direct handoff rejected
- Idempotent start packing
- Blocking exception → blocked state
- Command center packing pressure
- State derivation: ready_for_handoff vs handed_to_carrier vs shipped

**Full suite:** **555/555 passing**

---

## 18. Typecheck / build

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run build` | PASS (`/ops/packing` route confirmed) |

---

## 19. Screenshots captured

**Location:** `docs/ops-phase3-screenshots/`  
**Script:** `scripts/capture-ops-phase3-screenshots.mjs`  
**Count:** 40 images (10 scenes × 4 widths)

**Widths:** 390px · 430px · 1440px · 1728px

| File pattern | Content |
|--------------|---------|
| `ops-packing-summary-{width}.png` | Full pack command view + summary metrics |
| `ops-packing-must-leave-next-{width}.png` | Must Leave Next banner + cards |
| `ops-packing-ready-to-pack-{width}.png` | Ready to pack filter |
| `ops-packing-ready-for-handoff-{width}.png` | Ready for handoff filter |
| `ops-packing-blocked-{width}.png` | Blocked filter |
| `ops-packing-by-show-{width}.png` | By-show aggregation |
| `ops-command-packing-pressure-{width}.png` | Command center show cards |
| `ops-show-packing-block-{width}.png` | Show detail pack block |
| `ops-packing-action-{width}.png` | Start packing action state |
| `ops-order-packing-detail-{width}.png` | Order/show operational detail |

### Visual QA confirmation

| Requirement | Verified |
|-------------|----------|
| No horizontal overflow at 390 / 430 / 1440 / 1728 | PASS — `scrollWidth <= clientWidth` asserted per capture |
| Must Leave Next prominent | PASS — amber banner, first summary metric, prioritized card section |
| Packed ≠ handed ≠ shipped | PASS — separate summary columns; order UI distinguishes handed from shipped |
| Ready to pack vs ready for handoff distinguishable | PASS — separate filters, labels, and summary counts |
| Blocked orders visible | PASS — BLOCKED metric + filter; blocked reason on cards |
| Command center integration | PASS — Pack + handoff on show cards (3 shows) |
| Show detail integration | PASS — Pack + handoff block with view link |
| Multi-show competing demand | PASS — Brooklyn, Detroit, Nashville visible in by-show + command center |

---

## 20. Deferred to Ops Phase 4

- Exception **resolution** workflows
- Carrier API integration, label purchase, rate shopping
- Automated in-transit from handoff
- Notifications
- Returns
- Packing station hardware / barcode scanning
- AI routing recommendations

---

## Acceptance summary

An authorized Ops user can:

1. Open `/ops` and see outbound pressure on shows  
2. Open `/ops/packing` and see what must leave next  
3. Filter ready to pack / ready for handoff / blocked  
4. Start packing, mark packed, hand to carrier with persisted timestamps  
5. Confirm packed ≠ handed ≠ shipped  
6. View pack status on show and order detail  
7. Operate across multiple artists/shows with promise-based priority  

**Ops Phase 3 is complete. Ops Phase 4 not started.**
