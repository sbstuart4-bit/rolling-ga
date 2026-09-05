import { NextResponse } from "next/server";
import { dbHandle } from "@/db";
import { runHealthCheck } from "@/lib/health-check";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runHealthCheck(() => dbHandle());
  const statusCode = result.status === "ok" ? 200 : 503;

  return NextResponse.json(result, { status: statusCode });
}
