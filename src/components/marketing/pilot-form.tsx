"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { PILOT_ROLES } from "@/lib/marketing-pilot";
import { submitPilotInquiry, type PilotFormState } from "@/server/marketing/pilot-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: PilotFormState = {};

export function PilotForm() {
  const [state, action, pending] = useActionState(submitPilotInquiry, initialState);

  useEffect(() => {
    if (state.success && state.mailto) {
      window.location.assign(state.mailto);
    }
  }, [state.success, state.mailto]);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6" role="status">
        <p className="font-display text-3xl">Request ready.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {state.mailto
            ? "If your mail client opened, send that message to complete the inquiry. Nothing was filed in a CRM."
            : "Thanks. A follow-up inbox is not connected on this site yet, so nothing was filed automatically. Reach your Rolling GA contact directly to start a pilot."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <Field label="Name" htmlFor="pilot-name" error={state.fieldErrors?.name}>
        <Input id="pilot-name" name="name" autoComplete="name" aria-invalid={Boolean(state.fieldErrors?.name)} />
      </Field>
      <Field label="Email" htmlFor="pilot-email" error={state.fieldErrors?.email}>
        <Input
          id="pilot-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
      </Field>
      <Field label="Role" htmlFor="pilot-role" error={state.fieldErrors?.role}>
        <select
          id="pilot-role"
          name="role"
          defaultValue=""
          aria-invalid={Boolean(state.fieldErrors?.role)}
          className={cn(
            "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <option value="" disabled>
            Choose a role
          </option>
          {PILOT_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Artist or organization" htmlFor="pilot-org" error={state.fieldErrors?.organization}>
        <Input
          id="pilot-org"
          name="organization"
          autoComplete="organization"
          aria-invalid={Boolean(state.fieldErrors?.organization)}
        />
      </Field>
      <Field label="Notes" htmlFor="pilot-notes" error={state.fieldErrors?.notes} optional>
        <Textarea id="pilot-notes" name="notes" rows={4} />
      </Field>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.16em] sm:w-auto sm:px-8"
      >
        {pending ? "Sending…" : "Run a Rolling GA pilot"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">Optional</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
