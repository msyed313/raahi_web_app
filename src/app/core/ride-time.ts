export type RidePhase = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'past';

/** A ride is treated as "on going" for this long after its pickup time (unless it is completed or cancelled). */
const ONGOING_HOURS = 6;
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * Works out where a ride is in its life. The database has no "in progress" status, so "ongoing" is derived:
 * pickup time has passed (within ONGOING_HOURS), the booking is Confirmed or Assigned, and it is not Completed yet.
 */
export function ridePhase(status: string, pickup: Date, now: number): RidePhase {
  if (status === 'Cancelled' || status === 'NoShow') return 'cancelled';
  if (status === 'Completed') return 'completed';

  const diff = pickup.getTime() - now;
  if (diff > 0) return 'upcoming';
  if (-diff <= ONGOING_HOURS * HOUR && (status === 'Confirmed' || status === 'Assigned')) return 'ongoing';
  return 'past';
}

/** "2 days 3 h", "5 h 20 min", "12 min", "less than a minute" */
export function spanText(ms: number): string {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / DAY);
  const hours = Math.floor((abs % DAY) / HOUR);
  const mins = Math.floor((abs % HOUR) / MIN);

  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'}${hours ? ` ${hours} h` : ''}`;
  if (hours >= 1) return `${hours} h${mins ? ` ${mins} min` : ''}`;
  if (mins >= 1) return `${mins} min`;
  return 'less than a minute';
}

/** Less than 3 hours to go: worth highlighting. */
export function isSoon(pickup: Date, now: number): boolean {
  const diff = pickup.getTime() - now;
  return diff > 0 && diff < 3 * HOUR;
}