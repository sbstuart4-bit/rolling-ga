"use client";

import { Suspense } from "react";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { GuidedDemoMobileChrome } from "@/components/demo/guided-demo-mobile-chrome";
import type { GuidedDemoChromeProps } from "@/components/demo/guided-demo-shared";

const MKT_CAPTURE_COOKIE = "mkt-capture=1";

function readMarketingCaptureCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim() === MKT_CAPTURE_COOKIE);
}

/** Hides guided walkthrough chrome during marketing screenshot capture. */
function GuidedDemoMobileChromeInner(props: GuidedDemoChromeProps) {
  const searchParams = useSearchParams();
  const [hideChrome, setHideChrome] = React.useState(() => readMarketingCaptureCookie());

  React.useEffect(() => {
    if (searchParams.get("mktCapture") === "1") {
      document.cookie = `${MKT_CAPTURE_COOKIE}; path=/; SameSite=Lax; max-age=3600`;
      setHideChrome(true);
      return;
    }
    setHideChrome(readMarketingCaptureCookie());
  }, [searchParams]);

  if (hideChrome) return null;
  return <GuidedDemoMobileChrome {...props} />;
}

export function GuidedDemoMobileChromeGate(props: GuidedDemoChromeProps) {
  return (
    <Suspense fallback={null}>
      <GuidedDemoMobileChromeInner {...props} />
    </Suspense>
  );
}
