import { SafeArt } from "@/components/marketing/degens/safe-art";
import type { DegensArtId } from "@/components/marketing/degens/degens-art";
import { cn } from "@/lib/utils";

/**
 * Beat 1's fallback while the concert photography does not exist.
 *
 * A flyposted wall of Degens show posters, which then strips back to bare
 * surface and tape residue. The residue sits exactly where the sheets were, so
 * the same wall carries both halves of the beat: the room was full, and then
 * only traces of it are left.
 */
interface Placement {
  /** Percentages of the wall, so the residue can reuse the same coordinates. */
  left: number;
  top: number;
  width: number;
  rotate: number;
}

interface Sheet extends Placement {
  art: DegensArtId;
  /** Sheets further back sit deeper in shadow. */
  depth: 0 | 1 | 2;
  /**
   * Phones and tablets get their own arrangement — fewer, much larger sheets. A
   * sheet with no narrow placement simply is not pasted up at that width. The
   * switch happens at `lg`, not `md`: a portrait tablet is tall enough that the
   * wide arrangement leaves the bottom half of the wall bare.
   */
  mobile?: Placement;
}

/**
 * Sparse on purpose. A few sheets with bare wall between them reads as
 * flyposting; a full grid of them reads as a collage, and swallows the type.
 */
const SHEETS: readonly Sheet[] = [
  {
    art: "tourPoster",
    left: -6,
    top: -4,
    width: 27,
    rotate: -4,
    depth: 2,
    mobile: { left: -18, top: 2, width: 54, rotate: -5 },
  },
  {
    art: "numberedPoster",
    left: 25,
    top: 4,
    width: 21,
    rotate: 2.5,
    depth: 0,
    mobile: { left: 30, top: -6, width: 52, rotate: 3 },
  },
  { art: "returningPrint", left: 57, top: -8, width: 23, rotate: -2, depth: 1 },
  {
    art: "encorePoster",
    left: 80,
    top: 6,
    width: 26,
    rotate: 3,
    depth: 1,
    mobile: { left: 62, top: 24, width: 56, rotate: -3 },
  },
  { art: "tonightPoster", left: 44, top: 30, width: 19, rotate: 4, depth: 2 },
  {
    art: "encorePoster",
    left: 4,
    top: 26,
    width: 22,
    rotate: 2,
    depth: 2,
    mobile: { left: -10, top: 30, width: 48, rotate: 4 },
  },
];

const DEPTH_CLASS = ["opacity-95", "opacity-65 blur-[1px]", "opacity-35 blur-[2px]"] as const;

/**
 * Placement lives in CSS variables so one element can hold both arrangements and
 * the breakpoint does the switching — no duplicated markup, no duplicate image
 * downloads.
 */
function placementVars(sheet: Sheet): React.CSSProperties {
  const m = sheet.mobile ?? sheet;
  return {
    "--sheet-l": `${m.left}%`,
    "--sheet-t": `${m.top}%`,
    "--sheet-w": `${m.width}%`,
    "--sheet-r": `${m.rotate}deg`,
    "--sheet-l-md": `${sheet.left}%`,
    "--sheet-t-md": `${sheet.top}%`,
    "--sheet-w-md": `${sheet.width}%`,
    "--sheet-r-md": `${sheet.rotate}deg`,
  } as React.CSSProperties;
}

const SHEET_BOX =
  "absolute left-(--sheet-l) top-(--sheet-t) w-(--sheet-w) rotate-(--sheet-r) lg:left-(--sheet-l-md) lg:top-(--sheet-t-md) lg:w-(--sheet-w-md) lg:rotate-(--sheet-r-md)";

/** Bare brick-and-paint, which both states share. */
function Wall({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0", className)}
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 50% 20%, #1a1a1c 0%, #101012 45%, #08080a 100%)",
      }}
    />
  );
}

function Tape({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <span aria-hidden className={cn("mk-tape absolute", className)} style={style} />;
}

export function PosterWall({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn("mk-print absolute inset-0 overflow-hidden", className)}
      style={style}
    >
      <Wall />
      {SHEETS.map((sheet, i) => (
        <span
          key={`${sheet.art}-${i}`}
          className={cn(
            "block",
            SHEET_BOX,
            DEPTH_CLASS[sheet.depth],
            !sheet.mobile && "hidden lg:block",
          )}
          style={placementVars(sheet)}
        >
          <SafeArt
            art={sheet.art}
            alt=""
            sizes="(min-width: 1024px) 30vw, 56vw"
            quality={70}
            className="shadow-[0_18px_40px_rgba(0,0,0,0.65)]"
          />
          <Tape
            className="left-[8%] top-[-1.5%] h-[3%] w-[22%] rotate-[-6deg]"
            style={{ opacity: 0.75 }}
          />
          <Tape
            className="right-[6%] top-[-1%] h-[3%] w-[18%] rotate-[4deg]"
            style={{ opacity: 0.6 }}
          />
        </span>
      ))}

      {/* Hard flash from the front of the room. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 15%, rgba(255,255,255,0.06), transparent 68%)",
        }}
      />
      {/* Nav sits on darkness at the top; type sits on darkness at the bottom. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,8,10,0.9) 0%, rgba(8,8,10,0.3) 12%, rgba(8,8,10,0.15) 32%, rgba(8,8,10,0.86) 68%, #08080a 92%)",
        }}
      />
    </div>
  );
}

/**
 * The peak of the show, as light rather than as another image: the artist's lime
 * and red thrown across the same wall. Cheap enough to fade on every frame.
 */
export function StageLight({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 55% 40% at 50% 6%, rgba(216,255,62,0.4), transparent 64%), radial-gradient(ellipse 44% 34% at 16% 66%, rgba(255,74,40,0.34), transparent 68%), radial-gradient(ellipse 40% 30% at 88% 58%, rgba(216,255,62,0.24), transparent 70%)",
        ...style,
      }}
    />
  );
}

/** The same wall after load-out: the sheets are gone, the tape is not. */
export function BareWall({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn("mk-print absolute inset-0 overflow-hidden", className)}
      style={style}
    >
      <Wall className="brightness-[0.55]" />

      {SHEETS.map((sheet, i) => (
        <span
          key={`residue-${sheet.art}-${i}`}
          className={cn("block", SHEET_BOX, !sheet.mobile && "hidden lg:block")}
          style={{ ...placementVars(sheet), aspectRatio: 0.72 }}
        >
          {/* Where the sheet was: paste shadow, then the tape that outlasted it. */}
          <span
            className="absolute inset-0 block"
            style={{ background: "rgba(255,255,255,0.014)" }}
          />
          <Tape
            className="left-[8%] top-[-1.5%] h-[2.4%] w-[22%] rotate-[-6deg]"
            style={{ opacity: 0.16 }}
          />
          <Tape
            className="right-[6%] top-[-1%] h-[2.4%] w-[18%] rotate-[4deg]"
            style={{ opacity: 0.12 }}
          />
          {i % 3 === 0 ? (
            /* One torn corner still clinging on. */
            <span
              className="absolute left-[6%] top-[-1%] block h-[9%] w-[16%]"
              style={{
                background: "rgba(232,226,205,0.1)",
                clipPath: "polygon(0 0, 100% 0, 62% 100%, 0 74%)",
              }}
            />
          ) : null}
        </span>
      ))}

      {/* Work light left on at the front of the stage. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 26% at 50% 104%, rgba(216,255,62,0.09), transparent 70%), linear-gradient(to bottom, rgba(8,8,10,0.6) 0%, rgba(8,8,10,0.4) 45%, rgba(8,8,10,0.86) 100%)",
        }}
      />
    </div>
  );
}
