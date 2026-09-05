import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { resolveVerificationToken } from "@/server/events/queries";

/**
 * Renders the QR image a venue displays. The token is resolved first so a code is only
 * ever generated for a token that really belongs to a show, and the encoded URL is the
 * public scan entry point rather than anything containing an id.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/qr/[token]">) {
  const { token } = await ctx.params;

  const resolution = await resolveVerificationToken(token);
  if (!resolution.ok) {
    return NextResponse.json({ error: "Unknown or inactive token" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const svg = await QRCode.toString(`${origin}/e/${token}`, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      // Venue screens re-request this constantly; it changes only when the token rotates.
      "Cache-Control": "private, max-age=60",
    },
  });
}
