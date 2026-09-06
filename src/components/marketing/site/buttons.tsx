"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.12em] transition-opacity disabled:opacity-70";

/** Purple pill — primary mockup CTA. */
export function MktPrimaryButton({
  children,
  className,
  size = "default",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "large" | "compact";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        base,
        "bg-mkt-purple text-mkt-purple-fg hover:opacity-90",
        size === "large" && "px-8 py-4 text-sm",
        size === "compact" && "px-5 py-2.5 text-[0.6875rem]",
        size === "default" && "px-7 py-3.5 text-xs",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MktPrimarySubmitButton({
  label,
  pendingLabel = "Loading\u2026",
  className,
  size = "default",
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  size?: "default" | "large" | "compact";
}) {
  const { pending } = useFormStatus();
  return (
    <MktPrimaryButton type="submit" disabled={pending} className={className} size={size}>
      {pending ? pendingLabel : label}
      {!pending ? (
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      ) : null}
    </MktPrimaryButton>
  );
}

/** White outline pill — secondary mockup CTA. */
export function MktOutlineButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        base,
        "border border-white/80 bg-transparent px-7 py-3.5 text-xs text-mkt-fg hover:bg-white/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}
