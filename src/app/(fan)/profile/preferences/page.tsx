import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ApparelSizeForm } from "@/components/fan/apparel-size-form";
import { requireAuth } from "@/server/auth/request";
import { getSavedApparelSize } from "@/server/fans/preferences";

export const metadata = { title: "Preferences & sizes — Rolling GA" };

export default async function ProfilePreferencesPage() {
  const ctx = await requireAuth("/profile/preferences");
  const apparelSize = await getSavedApparelSize(ctx.userId);

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
            <h1 className="text-xl font-semibold tracking-tight">Preferences & sizes</h1>
            <p className="text-sm text-muted-foreground">Your default apparel size for eligible merch</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-5">
        <ApparelSizeForm initialSize={apparelSize} />
      </div>
    </div>
  );
}
