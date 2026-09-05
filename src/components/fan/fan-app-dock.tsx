"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Parks page chrome just above the tab bar, inside the phone frame. */
export function FanAppDock({ children }: { children: ReactNode }) {
  const [dock, setDock] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setDock(document.getElementById("fan-app-dock"));
  }, []);

  if (!dock) return null;
  return createPortal(children, dock);
}
