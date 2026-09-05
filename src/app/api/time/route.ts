import { NextResponse } from "next/server";
import { demoNow } from "@/server/demo/clock";

/**
 * The authoritative clock for every countdown in the product.
 *
 * Flash drops open and close on server timestamps, so the client measures its offset
 * against this endpoint rather than trusting the device clock. A fan with a fast clock
 * cannot see a drop early, and a fan with a slow one cannot keep buying after it closes.
 *
 * Returns the demo clock rather than the real wall clock, so a countdown fast-forwarded
 * from the demo board matches what the server actually enforces.
 */
export async function GET() {
  return NextResponse.json(
    { now: demoNow().getTime() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
