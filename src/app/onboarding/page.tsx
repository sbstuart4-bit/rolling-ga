import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { requireAuth } from "@/server/auth/request";

export const metadata: Metadata = { title: "Set up your Rolling GA ID" };

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const { next } = await props.searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : undefined;

  const ctx = await requireAuth(target ? `/onboarding?next=${encodeURIComponent(target)}` : "/onboarding");

  if (ctx.onboardingCompletedAt) {
    redirect(target ?? "/");
  }

  return <OnboardingWizard displayName={ctx.displayName} next={target} />;
}
