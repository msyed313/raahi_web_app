// Shapes returned/accepted by raahi-web-api (ASP.NET Core serialises to camelCase).

export type PaymentMethod = 'Card' | 'PayLater';

export interface VehicleType {
  id: number;
  name: string;
  description: string | null;
  maxPassengers: number;
  maxLuggage: number;
  imageUrl: string | null;
}

export interface RoutePrice {
  vehicleTypeId: number;
  vehicleTypeName: string;
  price: number;
}

export interface RouteItem {
  id: number;
  name: string;
  pickupLabel: string;
  dropoffLabel: string;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  prices: RoutePrice[];
}

export interface CalculatePriceRequest {
  vehicleTypeId: number;
  pickupDateTime: string; // local time, "YYYY-MM-DDTHH:mm:ss"
  routeId?: number | null;
  distanceKm?: number | null;
  isAirportPickup: boolean;
}

export interface PriceResult {
  baseAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  currency: string;
  pricingMethod: string;
}

export interface CreateBookingRequest {
  fullName: string;
  email: string;
  phone: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupPlaceId?: string | null;
  dropoffAddress: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffPlaceId?: string | null;
  pickupDateTime: string;
  passengers: number;
  luggage: number;
  flightNumber?: string | null;
  notes?: string | null;
  vehicleTypeId: number;
  routeId?: number | null;
  distanceKm?: number | null;
  quoteId?: number | null;
  paymentMethod: PaymentMethod;
}

export interface BookingConfirmation {
  bookingId: number;
  bookingRef: string;
  status: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  baseAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  currency: string;
  pickupDateTime: string;
  fullName: string;
  email: string;
}

export interface CreateQuoteRequest {
  fullName: string;
  email: string;
  phone: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDateTime?: string | null;
  passengers: number;
  luggage: number;
  flightNumber?: string | null;
  notes?: string | null;
  vehicleTypeId?: number | null;
}

export interface QuoteCreated {
  quoteId: number;
  quoteRef: string;
  status: string;
  fullName: string;
  email: string;
}
