import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WebAssembly build of Postgres and must be required by Node at
  // runtime rather than traced into the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
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
