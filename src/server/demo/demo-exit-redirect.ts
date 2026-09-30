import "server-only";

import { redirect } from "next/navigation";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";

/** After leaving a guided demo or marketing persona — only gated board users return to `/demo`. */
export async function redirectAfterLeavingDemoSession(): Promise<void> {
  if (await hasDemoBoardAccess()) {
    redirect("/demo?perspective=fan");
  }
  redirect("/home");
}
