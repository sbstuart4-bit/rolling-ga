"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type SignInState } from "@/server/auth/actions";
import type { DemoAccount } from "@/server/demo/accounts";
import { ROLE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-12 w-full rounded-xl bg-primary uppercase tracking-wider" size="lg" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
      {!pending && <ArrowRight className="size-4" aria-hidden />}
    </Button>
  );
}

export function SignInForm({
  next,
  demoAccounts,
  demoPassword,
}: {
  next?: string;
  demoAccounts: DemoAccount[];
  demoPassword: string;
}) {
  const [state, action] = useActionState<SignInState, FormData>(signInAction, {});
  const [email, setEmail] = React.useState(demoAccounts[0]?.email ?? "");
  const [password, setPassword] = React.useState(demoAccounts.length > 0 ? demoPassword : "");

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={state.error ? "sign-in-error" : undefined}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={state.error ? "sign-in-error" : undefined}
          />
        </div>

        {state.error && (
          <p
            id="sign-in-error"
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      {demoAccounts.length > 0 && (
        <section aria-labelledby="demo-accounts-heading" className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <h2
              id="demo-accounts-heading"
              className="eyebrow text-muted-foreground"
            >
              Demo accounts
            </h2>
            <span className="h-px flex-1 bg-border" />
          </div>

          <ul className="space-y-2">
            {demoAccounts.map((account) => {
              const selected = account.email === email;
              return (
                <li key={account.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(demoPassword);
                    }}
                    aria-pressed={selected}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium">{account.displayName}</span>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {account.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {account.blurb}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="text-center text-xs text-muted-foreground">
            All demo accounts use the password{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              {demoPassword}
            </code>
          </p>
        </section>
      )}
    </div>
  );
}
