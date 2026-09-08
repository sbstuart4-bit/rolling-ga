"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Modest operational refresh — no WebSockets. */
export function OpsAutoRefresh({ intervalMs = 45_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
