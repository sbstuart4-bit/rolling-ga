"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type SignUpState } from "@/server/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-12 w-full rounded-xl bg-primary uppercase tracking-wider"
      size="lg"
      disabled={pending}
    >
      {pending ? "Creating account…" : "Create account"}
      {!pending && <ArrowRight className="size-4" aria-hidden />}
    </Button>
  );
}

export function SignUpForm({ next }: { next?: string }) {
  const [state, action] = useActionState<SignUpState, FormData>(signUpAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="space-y-2">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" type="text" autoComplete="name" required maxLength={80} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.error ? "sign-up-error" : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby={state.error ? "sign-up-error" : "password-hint"}
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          At least 8 characters.
        </p>
      </div>

      {state.error && (
        <p
          id="sign-up-error"
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
