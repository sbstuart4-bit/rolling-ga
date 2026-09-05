"use client";

import * as React from "react";
import { clearDemoSessionAction } from "@/server/demo/session-actions";

/** Runs once on mount — cookie writes must happen in a Server Action, not during RSC render. */
export function DemoSessionReset() {
  React.useEffect(() => {
    void clearDemoSessionAction();
  }, []);

  return null;
}
