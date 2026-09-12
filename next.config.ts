import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WebAssembly build of Postgres and must be required by Node at
  // runtime rather than traced into the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  // Keep local PGlite clusters out of serverless traces — a broad `data/**` glob
  // can accidentally match unrelated paths (e.g. Next's own metadata helpers).
  outputFileTracingExcludes: {
    "*": ["./data/**"],
  },
  /** Hide the Next.js dev "N / Issue" badge — it bleeds into marketing screenshots. */
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/event/marisol-reyes-violeta-brooklyn-:year",
        destination: "/event/marisol-reyes-a-tender-night-brooklyn-:year",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
