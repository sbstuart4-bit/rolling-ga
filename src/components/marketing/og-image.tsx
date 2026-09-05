import { ImageResponse } from "next/og";

export const OG_ALT = "Rolling GA — The show ends. The connection doesn't.";
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function marketingOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#121212",
          color: "#F5F5F7",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <span style={{ display: "flex" }}>Rolling</span>
          <span style={{ display: "flex", color: "#7B3CFF", marginLeft: 12 }}>GA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
            THE SHOW ENDS.
          </div>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 0.95, color: "#7B3CFF" }}>
            THE CONNECTION DOESN'T.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#7B3CFF",
          }}
        >
          I was there
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
