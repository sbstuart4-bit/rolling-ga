import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WebAssembly build of Postgres and must be required by Node at
  // runtime rather than traced into the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
