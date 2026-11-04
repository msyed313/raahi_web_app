export interface Paged<T> {
  items: T[];
  totalRows: number;
  page: number;
  pageSize: number;
}

export interface AdminBookingItem {
  bookingId: number;
  bookingRef: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  isPayLater: boolean;
  pickupDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  passengers: number;
  luggage: number;
  flightNumber: string | null;
  totalAmount: number;
  currency: string;
  createdAtUtc: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleType: string;
  driverName: string | null;
}

export interface AdminBookingDetail {
  bookingId: number;
  bookingRef: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  isPayLater: boolean;
  pickupDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number | null;
  passengers: number;
  luggage: number;
  flightNumber: string | null;
  flightVerified: boolean;
  notes: string | null;
  baseAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  currency: string;
  cancelReason: string | null;
  cancelledAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleTypeId: number;
  vehicleType: string;
  driverId: number | null;
  driverName: string | null;
  driverPhone: string | null;
  driverPlate: string | null;
  routeName: string | null;
  quoteRef: string | null;
}

export interface BookingHistoryItem {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  note: string | null;
  changedAtUtc: string;
}

export interface BookingPaymentItem {
  id: number;
  gateway: string;
  gatewayTransactionId: string | null;
  amount: number;
  currency: string;
  status: string;
  failureReason: string | null;
  createdAtUtc: string;
  completedAtUtc: string | null;
}

export interface AdminBookingDetailResponse {
  booking: AdminBookingDetail;
  history: BookingHistoryItem[];
  payments: BookingPaymentItem[];
}

export interface UpdateStatusRequest {
  newStatus: string;
  note?: string | null;
  driverId?: number | null;
}

export interface AdminQuoteItem {
  quoteId: number;
  quoteRef: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDateTime: string | null;
  passengers: number;
  luggage: number;
  flightNumber: string | null;
  notes: string | null;
  vehicleTypeId: number | null;
  vehicleType: string | null;
  quotedAmount: number | null;
  currency: string;
  adminNote: string | null;
  quotedAtUtc: string | null;
  expiresAtUtc: string | null;
  createdAtUtc: string;
}

export interface RespondToQuoteRequest {
  quotedAmount: number;
  adminNote?: string | null;
  vehicleTypeId?: number | null;
  validityHours?: number | null;
}

export interface Driver {
  driverId: number;
  fullName: string;
  phone: string;
  plateNumber: string | null;
  isActive: boolean;
  vehicleTypeId: number | null;
  vehicleType: string | null;
}

export interface DashboardSummary {
  todayPickups: number;
  pendingBookings: number;
  needsDriver: number;
  newQuotes: number;
  cashToCollect: number;
  currency: string;
}

export interface UpcomingPickup {
  bookingId: number;
  bookingRef: string;
  status: string;
  pickupDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  vehicleType: string;
  driverName: string | null;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  upcoming: UpcomingPickup[];
}
