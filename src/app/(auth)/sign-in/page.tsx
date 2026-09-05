import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthSplashBackdrop } from "@/components/auth/auth-splash-backdrop";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { getAuthContext } from "@/server/auth/session";
import { DEMO_PASSWORD, listDemoAccounts } from "@/server/demo/accounts";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { next, guest } = await props.searchParams;
  const target = typeof next === "string" ? next : undefined;
  const isGuest = guest === "1";

  const ctx = await getAuthContext();
  if (ctx) redirect(target?.startsWith("/") ? target : "/");

  const demoAccounts = await listDemoAccounts();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#121212]">
      <AuthSplashBackdrop />

      <div className="relative flex flex-col items-center px-6 pt-14 pb-8 text-center">
        <Link href="/welcome" className="inline-block" aria-label="Rolling GA home">
          <RollingGaLogo size="default" />
        </Link>
      </div>

      <div className="relative mt-auto flex max-h-[82dvh] flex-col overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#121212] px-6 pt-7 pb-10 shadow-soft-lg">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <header className="space-y-1 text-center">
            <h1 className="font-display text-2xl tracking-wider">
              {isGuest ? "Continue as guest" : "Log in"}
            </h1>
            <p className="text-sm text-muted-foreground text-balance">
              {isGuest
                ? "Pick a demo fan account to explore Rolling GA."
                : "Reach your verified shows, credentials, and artist drops."}
            </p>
          </header>

          <SignInForm next={target} demoAccounts={demoAccounts} demoPassword={DEMO_PASSWORD} />

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href={target ? `/sign-up?next=${encodeURIComponent(target)}` : "/sign-up"}
              className="font-medium text-primary hover:underline"
            >
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
