import type { GeoPoint } from "@/lib/types";

const EARTH_RADIUS_MILES = 3958.8;
const METERS_PER_MILE = 1609.344;

export function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_MILES * c;
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  return haversineMiles(a, b) * METERS_PER_MILE;
}

/** Geofence check for attendance verification. Venue radius is configured per venue. */
export function isWithinRadius(
  point: GeoPoint,
  center: GeoPoint,
  radiusMeters: number,
  /** GPS accuracy reported by the browser, in metres. Widens the radius rather than failing an honest fan on a weak fix. */
  accuracyMeters = 0,
): boolean {
  const tolerance = Math.min(accuracyMeters, 250);
  return haversineMeters(point, center) <= radiusMeters + tolerance;
}
