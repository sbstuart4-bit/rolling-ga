"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className={cn("uppercase tracking-wider", className)}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="returnTo" value="/sign-in" />
      <SubmitButton className={className} />
    </form>
  );
}
