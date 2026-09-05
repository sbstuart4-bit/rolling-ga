import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { PoweredByRollingGa } from "@/components/brand/rolling-ga-mark";
import { formatEventDate } from "@/lib/format";
import { heroImageFor, type ResolvedTheme } from "@/lib/theme";
import type { VerificationMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

const METHOD_LABEL: Record<VerificationMethod, string> = {
  event_qr: "Scanned at the venue",
  geofence: "Confirmed on location",
  staff_override: "Confirmed by venue staff",
  ticket_barcode: "Ticket barcode",
  ticketmaster: "Ticketmaster",
  axs: "AXS",
  nfc: "NFC tap",
  wallet: "Wallet pass",
};

export interface CredentialData {
  id: string;
  artistName: string;
  tourName: string;
  venueName: string;
  city: string;
  region: string | null;
  startsAt: Date;
  timezone: string;
  method: VerificationMethod;
  verifiedAt: Date;
}

/**
 * The collectible object at the centre of the product.
 *
 * It has to feel like something a fan would keep, so it is built as a physical artefact:
 * the artist's artwork, a laminated sheen, a grain, and a serial number. The only
 * Rolling GA presence is the small mark at the bottom.
 */
export function CredentialCard({
  credential,
  theme,
  animate = false,
  className,
}: {
  credential: CredentialData;
  theme: ResolvedTheme;
  animate?: boolean;
  className?: string;
}) {
  const artwork = heroImageFor(theme);

  return (
    <article
      className={cn(
        "credential-sheen credential-grain relative isolate overflow-hidden rounded-[1.75rem] border border-artist-border bg-artist-surface text-artist-fg shadow-soft-lg",
        animate && "animate-stamp",
        className,
      )}
    >
      {artwork && (
        <Image
          src={artwork}
          alt=""
          fill
          sizes="(min-width: 768px) 480px, 100vw"
          className="-z-10 object-cover opacity-35"
        />
      )}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-artist-bg/40 via-artist-bg/80 to-artist-bg"
        aria-hidden
      />

      <div className="space-y-6 p-6 md:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow text-artist-accent">I was there</p>
          <BadgeCheck className="size-5 shrink-0 text-artist-accent" aria-hidden />
        </div>

        <div className="space-y-1">
          <p className="eyebrow font-artist text-artist-muted">{credential.artistName}</p>
          <h2 className="display-xl font-artist text-4xl md:text-5xl">{credential.city}</h2>
          <p className="text-sm text-artist-muted">
            {credential.venueName}
            {credential.region ? `, ${credential.region}` : ""}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-artist-border pt-5 text-sm">
          <div>
            <dt className="eyebrow text-artist-muted">Date</dt>
            <dd className="tabular mt-0.5 font-medium">
              {formatEventDate(credential.startsAt, credential.timezone)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-artist-muted">Tour</dt>
            <dd className="mt-0.5 truncate font-medium">{credential.tourName}</dd>
          </div>
          <div>
            <dt className="eyebrow text-artist-muted">Verified</dt>
            <dd className="mt-0.5 font-medium">{METHOD_LABEL[credential.method]}</dd>
          </div>
          <div>
            <dt className="eyebrow text-artist-muted">Credential</dt>
            <dd className="tabular mt-0.5 truncate font-mono text-xs uppercase">
              {credential.id.replace(/^vat_/, "")}
            </dd>
          </div>
        </dl>

        <PoweredByRollingGa className="justify-start pt-1 opacity-60" />
      </div>
    </article>
  );
}
