import type { ReactNode } from "react";

/** Pass-through — platform and fulfillment route groups supply their own shells. */
export default function OpsRootLayout({ children }: { children: ReactNode }) {
  return children;
}
