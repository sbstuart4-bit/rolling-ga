import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthSplashBackdrop } from "@/components/auth/auth-splash-backdrop";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { getAuthContext } from "@/server/auth/session";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Get started" };

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const { next } = await props.searchParams;
  const target = typeof next === "string" && next.startsWith("/") ? next : undefined;

  const ctx = await getAuthContext();
  if (ctx) redirect(target ?? "/");

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
            <h1 className="font-display text-2xl tracking-wider">Get started</h1>
            <p className="text-sm text-muted-foreground text-balance">
              Create your Rolling GA ID — one profile for every show you verify.
            </p>
          </header>

          <SignUpForm next={target} />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={target ? `/sign-in?next=${encodeURIComponent(target)}` : "/sign-in"}
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
