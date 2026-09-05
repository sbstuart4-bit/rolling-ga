"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, Check, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  verifyWithLocationAction,
  verifyWithStaffCodeAction,
  type VerifyState,
} from "@/server/verification/actions";

type Stage = "intro" | "locating" | "denied" | "submitting";

/**
 * Attendance verification.
 *
 * Location is requested only after the fan presses the button, and only after being
 * told what it is used for. Declining is a supported path rather than a dead end: the
 * fan is offered the code venue staff can read out.
 */
export function VerifyPanel({
  eventId,
  token,
  venueName,
  city,
  demoVenueLocation,
  demoStaffCode,
}: {
  eventId: string;
  token?: string;
  venueName: string;
  city: string;
  demoVenueLocation?: { lat: number; lng: number };
  demoStaffCode?: string;
}) {
  const [locationState, locationAction] = useActionState<VerifyState, FormData>(
    verifyWithLocationAction,
    {},
  );
  const [codeState, codeAction] = useActionState<VerifyState, FormData>(
    verifyWithStaffCodeAction,
    {},
  );

  const [stage, setStage] = React.useState<Stage>("intro");
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const coordsRef = React.useRef<{ lat: string; lng: string; accuracy: string }>({
    lat: "",
    lng: "",
    accuracy: "",
  });
  const [coords, setCoords] = React.useState({ lat: "", lng: "", accuracy: "" });

  const submitCoordinates = React.useCallback((lat: number, lng: number, accuracy = 25) => {
    const next = {
      lat: String(lat),
      lng: String(lng),
      accuracy: String(accuracy),
    };
    coordsRef.current = next;
    setCoords(next);
    setStage("submitting");
    requestAnimationFrame(() => {
      const form = formRef.current;
      if (!form) return;
      for (const [name, value] of Object.entries(next)) {
        const input = form.elements.namedItem(name);
        if (input instanceof HTMLInputElement) input.value = value;
      }
      form.requestSubmit();
    });
  }, []);

  const requestLocation = React.useCallback(() => {
    setGeoError(null);

    if (demoVenueLocation) {
      submitCoordinates(demoVenueLocation.lat, demoVenueLocation.lng);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStage("denied");
      setGeoError("This browser can't share location.");
      return;
    }

    setStage("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        submitCoordinates(
          position.coords.latitude,
          position.coords.longitude,
          Math.round(position.coords.accuracy ?? 0),
        );
      },
      (error) => {
        setStage("denied");
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was declined."
            : "Your device couldn't get a location fix.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }, [demoVenueLocation, submitCoordinates]);

  const failedGeofence = locationState.reason === "outside_geofence";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-artist-border bg-artist-surface p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-artist-accent" aria-hidden />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-artist-fg">Why we need your location</p>
            <p className="text-artist-muted">
              To confirm you&rsquo;re actually inside {venueName}. Your coordinates are checked
              once against the venue and then discarded — Rolling GA stores only that you were
              verified, how, and when.
            </p>
            {demoVenueLocation && (
              <p className="text-artist-muted">
                Demo mode skips GPS and uses the venue location so you can verify from your
                browser.
              </p>
            )}
          </div>
        </div>
      </div>

      <form ref={formRef} action={locationAction} className="space-y-3">
        <input type="hidden" name="eventId" value={eventId} />
        {token && <input type="hidden" name="token" value={token} />}
        <input type="hidden" name="lat" value={coords.lat} />
        <input type="hidden" name="lng" value={coords.lng} />
        <input type="hidden" name="accuracy" value={coords.accuracy} />

        <Button
          type="button"
          size="lg"
          onClick={requestLocation}
          disabled={stage === "locating" || stage === "submitting"}
          className="h-14 w-full bg-artist-accent text-base font-semibold text-artist-accent-fg hover:bg-artist-accent/90"
        >
          {stage === "locating" ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Finding you at {city}…
            </>
          ) : stage === "submitting" ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Verifying…
            </>
          ) : (
            <>
              <MapPin className="size-5" aria-hidden />
              I&rsquo;m here — verify me
            </>
          )}
        </Button>
      </form>

      {(geoError || locationState.error) && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {locationState.error ?? geoError}
            {failedGeofence && (
              <span className="mt-1 block text-artist-muted">
                If you are inside the venue, ask staff for the verification code below.
              </span>
            )}
          </span>
        </div>
      )}

      {(stage === "denied" || failedGeofence || locationState.reason === "location_unavailable") && (
        <section className="space-y-3 rounded-2xl border border-artist-border bg-artist-surface p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-artist-fg">Verify with a staff code</h2>
            <p className="text-sm text-artist-muted">
              Ask anyone working merch or the door for tonight&rsquo;s Rolling GA code. It changes
              per show.
            </p>
            {demoStaffCode && (
              <p className="text-sm text-artist-muted">
                Demo code for this show:{" "}
                <span className="font-mono font-semibold tracking-[0.2em] text-artist-fg">
                  {demoStaffCode}
                </span>
              </p>
            )}
          </div>

          <form action={codeAction} className="space-y-3">
            <input type="hidden" name="eventId" value={eventId} />
            <div className="space-y-1.5">
              <Label htmlFor="staff-code" className="text-artist-muted">
                Six-character code
              </Label>
              <Input
                id="staff-code"
                name="code"
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={8}
                placeholder="ABC123"
                className="h-12 border-artist-border bg-artist-bg text-center font-mono text-lg uppercase tracking-[0.3em] text-artist-fg"
              />
            </div>

            {codeState.error && (
              <p role="alert" className="text-sm text-danger">
                {codeState.error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              variant="outline"
              className="w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
            >
              <Check className="size-4" aria-hidden />
              Verify with code
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
