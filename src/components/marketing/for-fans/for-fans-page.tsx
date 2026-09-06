import { ForFansDemoCta } from "@/components/marketing/for-fans/for-fans-demo-cta";
import { ForFansFanControl } from "@/components/marketing/for-fans/for-fans-fan-control";
import { ForFansHero } from "@/components/marketing/for-fans/for-fans-hero";
import { ForFansNextShow } from "@/components/marketing/for-fans/for-fans-next-show";
import { ForFansNight } from "@/components/marketing/for-fans/for-fans-night";
import { ForFansShows } from "@/components/marketing/for-fans/for-fans-shows";

/** Consumer-facing /for-fans — the fan experience story. */
export function ForFansPage() {
  return (
    <>
      <ForFansHero />
      <ForFansNight />
      <ForFansShows />
      <ForFansNextShow />
      <ForFansFanControl />
      <ForFansDemoCta />
    </>
  );
}
