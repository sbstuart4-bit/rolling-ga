/**
 * Internal handoff target — not a carrier cutoff.
 * Derived from promised delivery with a conservative internal buffer.
 */
export function computeHandoffTargetAt(promisedDeliveryAt: Date | null): Date | null {
  if (!promisedDeliveryAt) return null;
  const bufferMs = 18 * 60 * 60 * 1000;
  return new Date(promisedDeliveryAt.getTime() - bufferMs);
}
