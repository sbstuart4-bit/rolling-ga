export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  if (process.env.NODE_ENV !== "production") {
    const { ensureDevDatabaseReady } = await import("@/db/dev-bootstrap");
    void ensureDevDatabaseReady().catch(() => {
      /* first request will retry — avoids blocking dev server listen */
    });
    return;
  }

  const { validateProductionEnvironment } = await import("@/lib/production-env");
  validateProductionEnvironment();
}
