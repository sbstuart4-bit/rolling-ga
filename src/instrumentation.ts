export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  const { validateProductionEnvironment } = await import("@/lib/production-env");
  validateProductionEnvironment();
}
