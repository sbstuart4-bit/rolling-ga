import { notFound } from "next/navigation";
import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { FanShowContextMarker } from "@/components/fan/fan-show-context-marker";
import { requireAuth } from "@/server/auth/request";
import { loadEventPage } from "@/server/events/context";

/**
 * Everything under a show URL lives inside that artist's visual world. The theme is
 * resolved once here and applied as CSS variables, so the page, the verification flow,
 * the drops and the product pages all inherit it without knowing it exists.
 */
export default async function EventLayout({ children, params }: LayoutProps<"/event/[slug]">) {
  const { slug } = await params;
  const ctx = await requireAuth(`/event/${slug}`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();

  return (
    <ArtistTakeover theme={page.theme} className="min-h-full">
      <FanShowContextMarker eventSlug={slug} />
      {children}
    </ArtistTakeover>
  );
}
