"use client";

import * as React from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Sharing a credential.
 *
 * Uses the native share sheet where the device has one, because that is how people
 * actually post a show, and falls back to copying the link everywhere else. The link
 * points at the public credential view, so the recipient needs no account.
 */
export function ShareCredentialButton({
  credentialId,
  artistName,
  city,
}: {
  credentialId: string;
  artistName: string;
  city: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    // Checking `navigator.share` must happen client-side to avoid SSR errors.
    // A ref-based approach avoids the lint concern about calling setState inside an effect
    // body, but this pattern (detecting a browser capability once on mount) is a
    // well-established exception. We suppress here and keep the canonical idiom.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator.share === "function");
  }, []);

  const share = async () => {
    const url = `${window.location.origin}/c/${credentialId}`;
    const text = `I was there — ${artistName} in ${city}.`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch {
        // Dismissing the share sheet is not an error; fall through to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy your credential link", url);
    }
  };

  return (
    <Button
      type="button"
      onClick={share}
      variant="outline"
      size="lg"
      className="w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden />
          Link copied
        </>
      ) : canShare ? (
        <>
          <Share2 className="size-4" aria-hidden />
          Share this credential
        </>
      ) : (
        <>
          <Copy className="size-4" aria-hidden />
          Copy share link
        </>
      )}
    </Button>
  );
}
