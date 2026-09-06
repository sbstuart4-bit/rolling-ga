"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Scrolls the switched perspective panel into view after tile navigation. */
export function DemoPerspectiveScroll() {
  const searchParams = useSearchParams();
  const perspective = searchParams.get("perspective") ?? "fan";

  useEffect(() => {
    const target = document.getElementById("demo-perspective-content");
    if (!target) return;

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [perspective]);

  return null;
}
