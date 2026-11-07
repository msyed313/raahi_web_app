import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BookingConfirmation,
  CalculatePriceRequest,
  CheckoutResponse,
  CreateBookingRequest,
  CreateQuoteRequest,
  GeoPoint,
  PaymentStatus,
  PlaceSuggestion,
  PriceResult,
  QuoteCreated,
  RouteItem,
  SandboxResult,
  VehicleType,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api`;

  vehicleTypes(passengers?: number | null, luggage?: number | null): Observable<VehicleType[]> {
    let params = new HttpParams();
    if (passengers) params = params.set('passengers', passengers);
    if (luggage !== null && luggage !== undefined) params = params.set('luggage', luggage);
    return this.http.get<VehicleType[]>(`${this.base}/catalog/vehicle-types`, { params });
  }

  routes(): Observable<RouteItem[]> {
    return this.http.get<RouteItem[]>(`${this.base}/catalog/routes`);
  }

  calculatePrice(request: CalculatePriceRequest): Observable<PriceResult> {
    return this.http.post<PriceResult>(`${this.base}/pricing/calculate`, request);
  }

  createBooking(request: CreateBookingRequest): Observable<BookingConfirmation> {
    return this.http.post<BookingConfirmation>(`${this.base}/bookings`, request);
  }

  createQuote(request: CreateQuoteRequest): Observable<QuoteCreated> {
    return this.http.post<QuoteCreated>(`${this.base}/quotes`, request);
  }
    // ---------- online payment ----------
  startCheckout(bookingRef: string, email: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/payments/checkout`, { bookingRef, email });
  }

  retryPayment(transactionId: string): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.base}/payments/retry`, { transactionId });
  }

  paymentStatus(transactionId: string): Observable<PaymentStatus> {
    return this.http.get<PaymentStatus>(`${this.base}/payments/status/${encodeURIComponent(transactionId)}`);
  }

  sandboxPay(transactionId: string, cardNumber: string): Observable<SandboxResult> {
    return this.http.post<SandboxResult>(`${this.base}/payments/sandbox/complete`, { transactionId, cardNumber });
  }

    // ---------- address search ----------
  searchPlaces(q: string): Observable<PlaceSuggestion[]> {
    return this.http.get<PlaceSuggestion[]>(`${this.base}/places/autocomplete`, { params: { q } });
  }

  drivingDistance(from: GeoPoint, to: GeoPoint): Observable<{ distanceKm: number }> {
    return this.http.post<{ distanceKm: number }>(`${this.base}/places/distance`, {
      fromLat: from.lat,
      fromLon: from.lon,
      toLat: to.lat,
      toLon: to.lon,
    });
  }


}
