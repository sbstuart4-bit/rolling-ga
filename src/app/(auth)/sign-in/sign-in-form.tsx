"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type SignInState } from "@/server/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-12 w-full rounded-xl bg-primary uppercase tracking-wider" size="lg" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
      {!pending && <ArrowRight className="size-4" aria-hidden />}
    </Button>
  );
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action] = useActionState<SignInState, FormData>(signInAction, {});

  return (
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
  );
}
