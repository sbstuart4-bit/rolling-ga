import "server-only";

import { redirect } from "next/navigation";
import { resolveGuidedRoute } from "@/lib/guided-demo";
import {
  artistGuidedDemoQuery,
  type ActiveArtistGuidedDemoContext,
} from "./artist-guided-demo-state";
import { guidedDemoQuery, type ActiveGuidedDemoContext } from "./guided-demo-state";
import { resolveArtistGuidedStepRoute } from "./artist-guided-demo-state";

export function redirectToFanGuidedStep(ctx: ActiveGuidedDemoContext): never {
  const route = resolveGuidedRoute(ctx.step.route, ctx.show);
  const qs = guidedDemoQuery(ctx.session);
  const join = route.includes("?") ? "&" : "?";
  redirect(`${route}${join}${qs}`);
}

export function redirectToArtistGuidedStep(ctx: ActiveArtistGuidedDemoContext): never {
  const route = resolveArtistGuidedStepRoute(ctx.step);
  const qs = artistGuidedDemoQuery(ctx.session);
  const join = route.includes("?") ? "&" : "?";
  redirect(`${route}${join}${qs}`);
}
