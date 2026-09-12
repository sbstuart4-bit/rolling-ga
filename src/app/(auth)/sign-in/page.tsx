import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthSplashBackdrop } from "@/components/auth/auth-splash-backdrop";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { getAuthContext } from "@/server/auth/session";
import { demoModeEnabled } from "@/lib/demo-mode";
import { SignInForm } from "./sign-in-form";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const { next, guest } = await props.searchParams;
  const target = typeof next === "string" ? next : undefined;

  if (guest === "1" && demoModeEnabled()) {
    redirect(target ? `/demo?perspective=fan&next=${encodeURIComponent(target)}` : "/demo?perspective=fan");
  }

  const ctx = await getAuthContext();
  if (ctx && !demoModeEnabled()) {
    redirect(target?.startsWith("/") ? target : "/");
  }

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
            <h1 className="font-display text-2xl tracking-wider">Log in</h1>
            <p className="text-sm text-muted-foreground text-balance">
              Sign in to your Rolling GA account.
            </p>
          </header>

          {ctx && demoModeEnabled() && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <p>
                Signed in as{" "}
                <span className="font-medium text-foreground">{ctx.displayName}</span>. Sign in
                below to switch accounts.
              </p>
              <SignOutButton className="mt-3" />
            </div>
          )}

          <SignInForm next={target} />

          {demoModeEnabled() && (
            <p className="text-center text-sm text-muted-foreground">
              Exploring the demo?{" "}
              <Link href="/demo" className="font-medium text-primary hover:underline">
                Try different personas
              </Link>
            </p>
          )}

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
