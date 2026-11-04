/** The API stores *Utc columns as UTC but serialises some without a "Z"; make sure the browser reads them as UTC. */
export function utc(value: string | null | undefined): string | null {
  if (!value) return null;
  return /(Z|[+-]\d\d:?\d\d)$/.test(value) ? value : `${value}Z`;
}

export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Assigned', 'Completed', 'Cancelled', 'NoShow'] as const;
export const QUOTE_STATUSES = ['New', 'Quoted', 'Accepted', 'Declined', 'Expired'] as const;

export function bookingStatusClass(status: string): string {
  switch (status) {
    case 'Confirmed':
      return 'bg-sky-100 text-sky-700';
    case 'Assigned':
      return 'bg-violet-100 text-violet-700';
    case 'Completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'Cancelled':
    case 'NoShow':
      return 'bg-red-100 text-red-700';
    default: // Pending
      return 'bg-saffron-100 text-saffron-700';
  }
}

export function paymentStatusClass(status: string): string {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700';
    case 'PayAtPickup':
      return 'bg-sky-100 text-sky-700';
    case 'Failed':
    case 'Refunded':
      return 'bg-red-100 text-red-700';
    default: // Unpaid, Pending
      return 'bg-saffron-100 text-saffron-700';
  }
}

export function paymentLabel(status: string): string {
  switch (status) {
    case 'PayAtPickup':
      return 'Pay driver';
    case 'Unpaid':
      return 'Unpaid';
    default:
      return status;
  }
}

export function quoteStatusClass(status: string): string {
  switch (status) {
    case 'New':
      return 'bg-saffron-100 text-saffron-700';
    case 'Quoted':
      return 'bg-sky-100 text-sky-700';
    case 'Accepted':
      return 'bg-emerald-100 text-emerald-700';
    default: // Declined, Expired
      return 'bg-slate-200 text-slate-600';
  }
}

export function statusLabel(status: string): string {
  return status === 'NoShow' ? 'No-show' : status;
}
