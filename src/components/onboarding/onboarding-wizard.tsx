"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, Bell, Disc3, QrCode } from "lucide-react";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { APPAREL_SIZES, PRODUCT_CATEGORIES, type ApparelSize, type ProductCategory } from "@/lib/types";
import { completeOnboardingAction, skipOnboardingAction, type OnboardingState } from "@/server/onboarding/actions";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  apparel: "Apparel",
  headwear: "Headwear",
  accessory: "Accessories",
  collectible: "Collectibles",
  music: "Music",
  print: "Prints",
  digital: "Digital",
};

interface ShippingState {
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

const EMPTY_SHIPPING: ShippingState = {
  shippingName: "",
  shippingLine1: "",
  shippingLine2: "",
  shippingCity: "",
  shippingRegion: "",
  shippingPostalCode: "",
  shippingCountry: "",
};

/** Steps that count toward the progress bar; intro and the final confirmation don't. */
const TOTAL_STEPS = 4;

export function OnboardingWizard({ displayName, next }: { displayName: string; next?: string }) {
  const [step, setStep] = React.useState(0);
  const [apparelSize, setApparelSize] = React.useState<ApparelSize | undefined>(undefined);
  const [categories, setCategories] = React.useState<ProductCategory[]>(["apparel", "music"]);
  const [notifyDrops, setNotifyDrops] = React.useState(true);
  const [notifyAnniversary, setNotifyAnniversary] = React.useState(true);
  const [notifyShowNews, setNotifyShowNews] = React.useState(false);
  const [shipping, setShipping] = React.useState<ShippingState>(EMPTY_SHIPPING);

  const [state, formAction] = useActionState<OnboardingState, FormData>(completeOnboardingAction, {});

  const firstName = displayName.split(" ")[0] || displayName;

  const payload = React.useMemo(
    () =>
      JSON.stringify({
        apparelSize,
        preferredCategories: categories,
        notifyDrops,
        notifyAnniversary,
        notifyShowNews,
        ...shipping,
        next,
      }),
    [apparelSize, categories, notifyDrops, notifyAnniversary, notifyShowNews, shipping, next],
  );

  function toggleCategory(cat: ProductCategory) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Header step={step} onBack={step > 0 && step < 5 ? () => setStep((s) => s - 1) : undefined} />

      <div className="flex flex-1 flex-col justify-center py-8">
        {step === 0 && <IntroStep firstName={firstName} onNext={() => setStep(1)} />}

        {step === 1 && (
          <SizeStep value={apparelSize} onChange={setApparelSize} onNext={() => setStep(2)} />
        )}

        {step === 2 && (
          <InterestsStep selected={categories} onToggle={toggleCategory} onNext={() => setStep(3)} />
        )}

        {step === 3 && (
          <NotificationsStep
            notifyDrops={notifyDrops}
            notifyAnniversary={notifyAnniversary}
            notifyShowNews={notifyShowNews}
            onChangeDrops={setNotifyDrops}
            onChangeAnniversary={setNotifyAnniversary}
            onChangeShowNews={setNotifyShowNews}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <ShippingStep value={shipping} onChange={setShipping} onNext={() => setStep(5)} />
        )}

        {step === 5 && (
          <DoneStep firstName={firstName} payload={payload} next={next} formAction={formAction} error={state.error} />
        )}
      </div>

      {step > 0 && step < 5 && (
        <form action={skipOnboardingAction} className="pt-2 text-center">
          <input type="hidden" name="next" value={next ?? ""} />
          <button
            type="submit"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </form>
      )}
    </div>
  );
}

function Header({ step, onBack }: { step: number; onBack?: () => void }) {
  const progressStep = Math.min(Math.max(step, 1), TOTAL_STEPS);

  return (
    <div className="space-y-4">
      <div className="flex h-8 items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
        ) : (
          <span className="size-8" />
        )}
        <RollingGaLogo size="default" />
        <span className="size-8" />
      </div>

      {step > 0 && step < 5 && (
        <div className="flex gap-1.5" role="progressbar" aria-valuenow={progressStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < progressStep ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  body,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        {eyebrow && <p className="eyebrow text-primary">{eyebrow}</p>}
        <h1 className="font-display text-3xl tracking-wide">{title}</h1>
        {body && <p className="text-sm text-muted-foreground text-balance">{body}</p>}
      </div>
      {children}
      {footer}
    </div>
  );
}

function IntroStep({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  const points = [
    { icon: QrCode, text: "Scan a code at the venue to verify you were there" },
    { icon: BadgeCheck, text: "Every verified show becomes a permanent credential" },
    { icon: Disc3, text: "Unlock drops and merch only attendees can see" },
  ];

  return (
    <StepShell
      eyebrow="Welcome"
      title={`Hey ${firstName}`}
      body="Let's set up your Rolling GA ID — it takes less than a minute."
      footer={
        <Button
          onClick={onNext}
          size="lg"
          className="h-13 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider hover:bg-primary/90"
        >
          Let&rsquo;s go
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      }
    >
      <ul className="space-y-3">
        {points.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            <p className="pt-1.5 text-sm text-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </StepShell>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        selected ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function SizeStep({
  value,
  onChange,
  onNext,
}: {
  value: ApparelSize | undefined;
  onChange: (v: ApparelSize) => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      eyebrow="Merch"
      title="What&rsquo;s your size?"
      body="We&rsquo;ll pre-select this at checkout. You can change it any time in your profile."
      footer={
        <Button
          onClick={onNext}
          size="lg"
          className="h-13 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      }
    >
      <div className="flex flex-wrap justify-center gap-2">
        {APPAREL_SIZES.map((size) => (
          <Chip key={size} selected={value === size} onClick={() => onChange(size)}>
            {size}
          </Chip>
        ))}
      </div>
    </StepShell>
  );
}

function InterestsStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: ProductCategory[];
  onToggle: (cat: ProductCategory) => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      eyebrow="Drops"
      title="What do you want to hear about?"
      body="Pick as many as you like — this tunes what shows up on your home feed."
      footer={
        <Button
          onClick={onNext}
          size="lg"
          className="h-13 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      }
    >
      <div className="flex flex-wrap justify-center gap-2">
        {PRODUCT_CATEGORIES.map((cat) => (
          <Chip key={cat} selected={selected.includes(cat)} onClick={() => onToggle(cat)}>
            {CATEGORY_LABELS[cat]}
          </Chip>
        ))}
      </div>
    </StepShell>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-left"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

function NotificationsStep({
  notifyDrops,
  notifyAnniversary,
  notifyShowNews,
  onChangeDrops,
  onChangeAnniversary,
  onChangeShowNews,
  onNext,
}: {
  notifyDrops: boolean;
  notifyAnniversary: boolean;
  notifyShowNews: boolean;
  onChangeDrops: (v: boolean) => void;
  onChangeAnniversary: (v: boolean) => void;
  onChangeShowNews: (v: boolean) => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      eyebrow="Notifications"
      title="Stay in the loop"
      body="You can change these any time from your profile."
      footer={
        <Button
          onClick={onNext}
          size="lg"
          className="h-13 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      }
    >
      <div className="space-y-3">
        <Toggle
          label="New drops"
          description="Flash drops and new merch from artists you've verified with"
          checked={notifyDrops}
          onChange={onChangeDrops}
        />
        <Toggle
          label="Anniversary reminders"
          description="When a show you attended comes back around"
          checked={notifyAnniversary}
          onChange={onChangeAnniversary}
        />
        <Toggle
          label="Show news"
          description="Updates about tours and shows you might be interested in"
          checked={notifyShowNews}
          onChange={onChangeShowNews}
        />
      </div>
      <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Bell className="size-4" aria-hidden />
      </div>
    </StepShell>
  );
}

function ShippingStep({
  value,
  onChange,
  onNext,
}: {
  value: ShippingState;
  onChange: (v: ShippingState) => void;
  onNext: () => void;
}) {
  function set(field: keyof ShippingState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: e.target.value });
  }

  return (
    <StepShell
      eyebrow="Shipping"
      title="Where should merch go?"
      body="Optional — add it now so checkout is one tap when a drop goes live."
      footer={
        <Button
          onClick={onNext}
          size="lg"
          className="h-13 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="shippingName">Name</Label>
          <Input id="shippingName" value={value.shippingName} onChange={set("shippingName")} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shippingLine1">Address</Label>
          <Input
            id="shippingLine1"
            value={value.shippingLine1}
            onChange={set("shippingLine1")}
            autoComplete="address-line1"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="shippingCity">City</Label>
            <Input id="shippingCity" value={value.shippingCity} onChange={set("shippingCity")} autoComplete="address-level2" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shippingRegion">State</Label>
            <Input
              id="shippingRegion"
              value={value.shippingRegion}
              onChange={set("shippingRegion")}
              autoComplete="address-level1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="shippingPostalCode">ZIP</Label>
            <Input
              id="shippingPostalCode"
              value={value.shippingPostalCode}
              onChange={set("shippingPostalCode")}
              autoComplete="postal-code"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shippingCountry">Country</Label>
            <Input
              id="shippingCountry"
              value={value.shippingCountry}
              onChange={set("shippingCountry")}
              autoComplete="country"
              placeholder="US"
              maxLength={2}
            />
          </div>
        </div>
      </div>
    </StepShell>
  );
}

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="h-13 w-full rounded-xl bg-primary text-base font-semibold uppercase tracking-wider hover:bg-primary/90"
      disabled={pending}
    >
      {pending ? "Setting up…" : "Enter Rolling GA"}
      {!pending && <ArrowRight className="size-4" aria-hidden />}
    </Button>
  );
}

function DoneStep({
  firstName,
  payload,
  next,
  formAction,
  error,
}: {
  firstName: string;
  payload: string;
  next?: string;
  formAction: (formData: FormData) => void;
  error?: string;
}) {
  return (
    <StepShell
      eyebrow="All set"
      title={`You're in, ${firstName}`}
      body="Your Rolling GA ID is ready. Verify at your next show to start your passport."
      footer={
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="payload" value={payload} />
          <input type="hidden" name="next" value={next ?? ""} />
          {error && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-center text-sm text-danger">
              {error}
            </p>
          )}
          <FinishButton />
        </form>
      }
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <BadgeCheck className="size-6" aria-hidden />
      </div>
    </StepShell>
  );
}
