const pad = (n: number) => String(n).padStart(2, '0');

/** Local "YYYY-MM-DDTHH:mm" (the format of <input type="datetime-local">), `hoursAhead` from now, rounded up to 5 minutes. */
export function localDateTimeAhead(hoursAhead: number): string {
  const d = new Date(Date.now() + hoursAhead * 3_600_000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The API expects "YYYY-MM-DDTHH:mm:ss" (local time, no timezone). */
export function toApiDateTime(local: string): string {
  return local.length === 16 ? `${local}:00` : local;
}

export function isAirport(text: string | null | undefined): boolean {
  return /airport/i.test(text ?? '');
}

export function duration(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m} min`;
}
