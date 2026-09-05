import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Each test file builds its own WebAssembly Postgres instance (see src/test/setup.ts).
    // Running files one at a time keeps exactly one of those heaps alive; overlapping them
    // exhausts the process address space.
    fileParallelism: false,
    // Postgres round-trips are slower than the previous in-memory SQLite, and each file
    // applies the full migration baseline before its first test.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
