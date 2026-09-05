import Image from "next/image";
import { Lock, Play } from "lucide-react";
import type { EventContentKind } from "@/lib/types";

interface ContentRow {
  id: string;
  kind: EventContentKind;
  title: string | null;
  body: string | null;
  mediaUrl: string | null;
  attendeesOnly: boolean;
}

const KIND_LABEL: Record<EventContentKind, string> = {
  artist_message: "From the artist",
  photo: "Photo",
  setlist: "Setlist",
  video_link: "Video",
  thank_you: "Thank you",
};

/**
 * The artist's own words and media for a show. Rows marked attendees-only are filtered
 * out server-side, so this component never receives content the reader isn't entitled
 * to see.
 */
export function EventContentList({ content }: { content: ContentRow[] }) {
  return (
    <section className="space-y-3">
      <h2 className="eyebrow text-artist-muted">From the night</h2>

      <ul className="space-y-3">
        {content.map((row) => (
          <li
            key={row.id}
            className="overflow-hidden rounded-2xl border border-artist-border bg-artist-surface"
          >
            {row.mediaUrl && row.kind === "photo" && (
              <div className="relative aspect-[4/3] w-full bg-artist-bg">
                <Image
                  src={row.mediaUrl}
                  alt={row.title ?? ""}
                  fill
                  sizes="(min-width: 768px) 640px, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <span className="eyebrow text-artist-accent">{KIND_LABEL[row.kind]}</span>
                {row.attendeesOnly && (
                  <span className="flex items-center gap-1 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-artist-muted">
                    <Lock className="size-3" aria-hidden />
                    Attendees
                  </span>
                )}
              </div>

              {row.title && (
                <h3 className="font-artist text-lg font-semibold text-artist-fg">{row.title}</h3>
              )}

              {row.body && (
                <div className="space-y-1 text-sm leading-relaxed text-artist-muted">
                  {row.kind === "setlist" ? (
                    <ol className="tabular space-y-0.5">
                      {row.body.split("\n").map((line, index) => (
                        <li key={line} className="flex gap-3">
                          <span className="w-5 shrink-0 text-right text-artist-muted/60">
                            {index + 1}
                          </span>
                          <span className="text-artist-fg">{line}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    row.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                  )}
                </div>
              )}

              {row.kind === "video_link" && row.mediaUrl && (
                <a
                  href={row.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-artist-accent underline underline-offset-4"
                >
                  <Play className="size-3.5" aria-hidden />
                  Watch
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
