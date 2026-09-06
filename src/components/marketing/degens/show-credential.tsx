import Image from "next/image";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { DEGENS_ART } from "./degens-art";
import { cn } from "@/lib/utils";

/**
 * The credential as an object rather than a UI card — laminate, punch, stub,
 * serial. It is the one thing on the page a fan would keep, so it is built to
 * look like it could be kept.
 *
 * Marketing-only. The fan app has its own credential component; this one exists
 * to be shown at a scale that component was never designed for.
 */
export function ShowCredential({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "credential-sheen credential-grain relative isolate overflow-hidden border border-world-accent/25 shadow-[0_40px_90px_rgba(0,0,0,0.75)]",
        className,
      )}
      style={{
        background: "linear-gradient(160deg, #16161a 0%, #0e0e10 55%, #0a0a0b 100%)",
      }}
    >
      {/* Lanyard punch and the accent rule that runs under it. */}
      <div className="flex items-center gap-4 px-7 pt-7">
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full border border-world-accent/40 bg-black/60"
        />
        <span aria-hidden className="h-px flex-1 bg-world-accent/30" />
        <span className="mk-kicker text-world-accent">Verified attendance</span>
      </div>

      <div className="px-7 pb-7 pt-8">
        <Image
          src={DEGENS_ART.logo.src}
          alt="The Degens"
          width={DEGENS_ART.logo.natural.width}
          height={DEGENS_ART.logo.natural.height}
          sizes="220px"
          className="h-7 w-auto md:h-9"
        />

        <p className="mk-display mt-8 text-[clamp(3rem,9vw,6rem)] leading-[0.82]">Detroit</p>

        <dl className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-world-rule pt-5">
          <div>
            <dt className="mk-kicker text-world-muted">Date</dt>
            <dd className="mk-display mt-1 text-xl">June 30</dd>
          </div>
          <div>
            <dt className="mk-kicker text-world-muted">Venue</dt>
            <dd className="mk-display mt-1 text-xl">Ironworks</dd>
          </div>
        </dl>

        <p className="mk-display mt-10 text-[clamp(2.25rem,7vw,4.25rem)] leading-[0.85] text-world-accent">
          I was there.
        </p>
      </div>

      {/* The stub: perforation, serial, and the only Rolling GA presence. */}
      <div
        className="flex items-center justify-between gap-4 border-t border-dashed border-world-accent/25 px-7 py-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        <span className="tabular font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-world-muted">
          mkt&middot;detroit&middot;0630
        </span>
        <RollingGaMark size="sm" tone="mono" className="text-world-muted" />
      </div>
    </article>
  );
}

/**
 * One kept show, at the size a history is counted in. Seven of these read as a
 * collection; seven feature cards would read as a feature list.
 */
export function CredentialStub({
  city,
  detail,
  dimmed = false,
  className,
}: {
  city: string;
  detail: string;
  dimmed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "credential-grain relative shrink-0 border border-world-rule px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.6)]",
        dimmed && "opacity-45",
        className,
      )}
      style={{ background: "linear-gradient(160deg, #141417 0%, #0b0b0c 100%)" }}
    >
      <span aria-hidden className="mb-3 block h-px w-6 bg-world-accent/50" />
      <p className="mk-display text-lg leading-none md:text-xl">{city}</p>
      <p className="mk-kicker mt-2 text-world-muted">{detail}</p>
    </div>
  );
}
