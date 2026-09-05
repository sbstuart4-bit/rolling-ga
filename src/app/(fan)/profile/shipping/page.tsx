import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ShippingAddressForm } from "@/components/fan/shipping-address-form";
import { mergeSavedShippingAddress } from "@/lib/shipping-address";
import { requireAuth } from "@/server/auth/request";
import { getSavedShippingAddress } from "@/server/fans/preferences";

export const metadata = { title: "Shipping address — Rolling GA" };

export default async function ProfileShippingPage() {
  const ctx = await requireAuth("/profile/shipping");
  const savedShippingAddress = await getSavedShippingAddress(ctx.userId);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Back to profile"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Shipping address</h1>
            <p className="text-sm text-muted-foreground">Default delivery address for checkout</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5">
        <ShippingAddressForm initialAddress={mergeSavedShippingAddress(savedShippingAddress)} />
      </div>
    </div>
  );
}
