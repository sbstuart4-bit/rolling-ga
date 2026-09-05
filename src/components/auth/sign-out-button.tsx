import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/auth/actions";

export function SignOutButton({
  children = "Sign out",
  variant = "outline",
  size = "lg",
  className,
}: {
  children?: ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  return (
    <form action={signOutAction} className="w-full">
      <Button type="submit" variant={variant} size={size} className={`w-full ${className ?? ""}`}>
        {children}
      </Button>
    </form>
  );
}
