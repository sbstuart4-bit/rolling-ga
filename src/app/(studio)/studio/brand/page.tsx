import type { Metadata } from "next";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { resolveArtistTheme } from "@/server/theme/resolve";
import { ArtistThemeScope } from "@/components/artist/artist-takeover";
import { CredentialCard } from "@/components/fan/credential-card";

export const metadata: Metadata = { title: "Brand — Artist Studio" };

export default async function StudioBrandPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/brand");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="p-6 text-muted-foreground">Select an artist.</div>;

  const theme = await resolveArtistTheme(artistId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand</h1>
          <p className="text-sm text-muted-foreground">
            Configure your visual identity at the artist, tour and show level.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Token configuration</h2>
          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Background", theme.background],
                ["Surface", theme.surface],
                ["Foreground", theme.foreground],
                ["Accent", theme.accent],
                ["Accent 2", theme.accentSecondary],
                ["Font", theme.fontId ?? "Default (Inter)"],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="eyebrow text-muted-foreground">{label}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {typeof value === "string" && value.startsWith("#") || value?.startsWith("oklch") || value?.startsWith("rgb") ? (
                      <span
                        className="inline-block size-4 rounded-full border border-border"
                        style={{ background: value as string }}
                        aria-hidden
                      />
                    ) : null}
                    <p className="font-mono text-xs">{value ?? <span className="italic text-muted-foreground">Not set</span>}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Brand tokens are configured in code for this demo. The full brand manager UI (colour pickers, image uploads, tour-level overrides) would appear here in production.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">Credential preview</h2>
          <ArtistThemeScope theme={theme}>
            <CredentialCard
              theme={theme}
              credential={{
                id: "preview",
                artistName: theme.showMessaging ?? "Artist Name",
                tourName: "Tour Name",
                venueName: "The Venue",
                city: "Your City",
                region: "ST",
                startsAt: new Date(),
                timezone: "America/New_York",
                method: "event_qr",
                verifiedAt: new Date(),
              }}
            />
          </ArtistThemeScope>
        </section>
      </div>
    </div>
  );
}
