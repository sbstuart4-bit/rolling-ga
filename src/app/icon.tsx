import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121212",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 12 12" fill="#7B3CFF">
          <path d="M6 0.5L7.4 4.2H11.2L8.1 6.5L9.4 10.2L6 8L2.6 10.2L3.9 6.5L8.1 6.5L0.8 4.2H4.6L6 0.5Z" />
        </svg>
      </div>
    ),
    size,
  );
}
