import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#121212]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <Button asChild className="h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.16em]">
        <Link href="/pilot">Run a pilot</Link>
      </Button>
    </div>
  );
}
