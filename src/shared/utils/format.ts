import { CONFIG } from '@/constants/config';

/** Formats meters as a human-readable distance string (e.g., "1.2 km" or "500 m") */
export function formatDistance(meters: number): string {
  if (meters >= CONFIG.METERS_PER_KM) {
    return `${(meters / CONFIG.METERS_PER_KM).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/** Formats nullable meters — returns '--' for null */
export function formatDistanceOrDash(meters: number | null): string {
  if (meters === null) return '--';
  return formatDistance(meters);
}
