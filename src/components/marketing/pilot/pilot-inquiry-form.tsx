"use client";

import { useActionState, type ReactNode } from "react";
import { PILOT_PARTNER_TYPES } from "@/lib/marketing-pilot";
import type { PilotFormState } from "@/lib/marketing-pilot-form";
import { MktPrimarySubmitButton } from "@/components/marketing/site";
import { submitPilotInquiry } from "@/server/marketing/pilot-action";
import { cn } from "@/lib/utils";

const initialState: PilotFormState = {};

const fieldClass =
  "h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-[#0a0a0a] outline-none transition-colors placeholder:text-[#a1a1aa] focus-visible:border-mkt-purple focus-visible:ring-2 focus-visible:ring-mkt-purple/20";

const selectClass = cn(fieldClass, "appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10");

export function PilotInquiryForm() {
  const [state, action] = useActionState(submitPilotInquiry, initialState);

  if (state.success) {
    return (
      <div
        className="rounded-2xl border border-mkt-purple/30 bg-mkt-purple/5 p-6 sm:p-8"
        role="status"
      >
        <p className="font-display text-2xl uppercase tracking-[0.04em] text-[#0a0a0a] sm:text-3xl">
          Thanks — your pilot inquiry was sent.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#52525b] sm:text-base">
          We&rsquo;ll follow up about the show or opportunity you shared.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.notConfigured ? (
        <div
          className="rounded-xl border border-black/15 bg-[#fafafa] p-4 sm:p-5"
          role="status"
        >
          <p className="text-sm leading-relaxed text-[#52525b] sm:text-base">
            Your details were not sent. Pilot email delivery is not configured on this site yet,
            so inquiries cannot be delivered automatically. Reach your Rolling GA contact directly
            to start a pilot conversation.
          </p>
        </div>
      ) : null}

      {state.error && !state.fieldErrors ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5" role="alert">
          <p className="text-sm leading-relaxed text-red-700 sm:text-base">{state.error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="pilot-name" required error={state.fieldErrors?.name}>
          <input
            id="pilot-name"
            name="name"
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.name)}
            className={fieldClass}
          />
        </Field>
        <Field label="Work email" htmlFor="pilot-email" required error={state.fieldErrors?.email}>
          <input
            id="pilot-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organization" htmlFor="pilot-org" error={state.fieldErrors?.organization}>
          <input
            id="pilot-org"
            name="organization"
            autoComplete="organization"
            aria-invalid={Boolean(state.fieldErrors?.organization)}
            className={fieldClass}
          />
        </Field>
        <Field label="Role" htmlFor="pilot-role-title" error={state.fieldErrors?.roleTitle}>
          <input
            id="pilot-role-title"
            name="roleTitle"
            autoComplete="organization-title"
            aria-invalid={Boolean(state.fieldErrors?.roleTitle)}
            className={fieldClass}
          />
        </Field>
      </div>

      <Field label="I am a" htmlFor="pilot-partner-type" required error={state.fieldErrors?.partnerType}>
        <select
          id="pilot-partner-type"
          name="partnerType"
          defaultValue=""
          aria-invalid={Boolean(state.fieldErrors?.partnerType)}
          className={selectClass}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2352525b' stroke-width='1.5' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          }}
        >
          <option value="" disabled>
            Choose one
          </option>
          {PILOT_PARTNER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]">
          Do you have a show in mind? <span className="text-mkt-purple">*</span>
        </legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <RadioOption
            id="pilot-show-yes"
            name="hasShowInMind"
            value="yes"
            label="Yes"
            error={state.fieldErrors?.hasShowInMind}
          />
          <RadioOption
            id="pilot-show-not-yet"
            name="hasShowInMind"
            value="not_yet"
            label="Not yet"
            error={state.fieldErrors?.hasShowInMind}
          />
        </div>
        {state.fieldErrors?.hasShowInMind ? (
          <p className="text-sm text-red-600">{state.fieldErrors.hasShowInMind}</p>
        ) : null}
      </fieldset>

      <Field
        label="Show / artist / opportunity"
        htmlFor="pilot-opportunity"
        error={state.fieldErrors?.opportunity}
      >
        <input
          id="pilot-opportunity"
          name="opportunity"
          className={fieldClass}
          aria-invalid={Boolean(state.fieldErrors?.opportunity)}
        />
      </Field>

      <Field label="Message" htmlFor="pilot-message" error={state.fieldErrors?.message}>
        <textarea
          id="pilot-message"
          name="message"
          rows={4}
          className={cn(fieldClass, "h-auto resize-y py-3")}
        />
      </Field>

      {state.error && state.fieldErrors ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <MktPrimarySubmitButton
        label="Start the conversation"
        pendingLabel="Sending…"
        size="large"
        className="group w-full sm:w-auto"
      />

      <p className="text-xs leading-relaxed text-[#71717a] sm:text-sm">
        This form sends your inquiry to Rolling GA by email. It does not create a CRM ticket or
        store your information in a database.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]">
        {label}
        {required ? <span className="text-mkt-purple"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function RadioOption({
  id,
  name,
  value,
  label,
  error,
}: {
  id: string;
  name: string;
  value: string;
  label: string;
  error?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#0a0a0a]",
        error && "text-red-600",
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        className="size-4 accent-mkt-purple"
        aria-invalid={Boolean(error)}
      />
      {label}
    </label>
  );
}
