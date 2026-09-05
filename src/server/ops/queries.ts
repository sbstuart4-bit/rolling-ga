import "server-only";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, events, products } from "@/db/schema";
import {
  buildDemoAssetAudit,
  countAssetIssuesForArtist,
  summarizeDemoAssetAudit,
} from "@/lib/demo-asset-audit";
import { FULL_ARTISTS } from "@/db/seed/definitions";
import { demoArtistBrandImages } from "@/lib/demo-assets";
import type { DemoAssetArtist } from "@/lib/demo-asset-audit";

const DEMO_ARTIST_KEYS: Record<string, DemoAssetArtist> = {
  art_the_degens: "the_degens",
  art_nova_kestrel: "nova_kestrel",
  art_low_country: "the_low_country",
  art_marisol_reyes: "marisol_reyes",
};

export async function getPlatformOpsOverview() {
  const auditEntries = buildDemoAssetAudit();
  const auditSummary = summarizeDemoAssetAudit(auditEntries);

  const [[{ artistCount }], [{ showCount }], [{ productCount }]] = await Promise.all([
    db
      .select({ artistCount: count() })
      .from(artists)
      .where(eq(artists.isDemo, true)),
    db
      .select({ showCount: count() })
      .from(events)
      .where(eq(events.isDemo, true)),
    db
      .select({ productCount: count() })
      .from(products)
      .where(and(eq(products.isDemo, true), eq(products.active, true))),
  ]);

  const assetIssues =
    auditSummary.broken +
    auditSummary.unused +
    auditSummary.placeholderSvgs;

  return {
    artistCount: Math.min(artistCount, 4),
    showCount,
    productCount,
    assetIssues,
    auditSummary,
  };
}

export async function listPlatformOpsArtists() {
  const auditEntries = buildDemoAssetAudit();

  const rows = await Promise.all(
    FULL_ARTISTS.map(async (artist) => {
      const assetKey = DEMO_ARTIST_KEYS[artist.id]!;
      const [[{ showCount }], [{ productCount }]] = await Promise.all([
        db
          .select({ showCount: count() })
          .from(events)
          .where(and(eq(events.artistId, artist.id), eq(events.isDemo, true))),
        db
          .select({ productCount: count() })
          .from(products)
          .where(
            and(eq(products.artistId, artist.id), eq(products.isDemo, true), eq(products.active, true)),
          ),
      ]);

      const brand = demoArtistBrandImages(artist.id);
      const assetIssues = countAssetIssuesForArtist(auditEntries, assetKey);

      return {
        id: artist.id,
        slug: artist.slug,
        name: artist.name,
        bio: artist.bio,
        assetKey,
        logoUrl: brand?.logoUrl ?? `/demo/logo-${artist.slug}.svg`,
        heroImageUrl: brand?.heroImageUrl ?? `/demo/poster-${artist.slug}-brand.svg`,
        showCount,
        productCount,
        assetIssues,
      };
    }),
  );

  return rows;
}

export async function getPlatformOpsArtist(artistId: string) {
  const artists = await listPlatformOpsArtists();
  return artists.find((a) => a.id === artistId) ?? null;
}
