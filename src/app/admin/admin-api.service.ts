import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AdminBookingDetailResponse,
  AdminBookingItem,
  AdminQuoteItem,
  CatalogRoute,
  CatalogRouteSave,
  CatalogVehicle,
  CatalogVehicleSave,
  DashboardResponse,
  Driver,
  Paged,
  QuoteActionResult,
  RespondToQuoteRequest,
  UpdateStatusRequest,
} from './admin-models';

export interface BookingFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface QuoteFilters {
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

function toParams(values: Record<string, string | number | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params = params.set(key, value);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admin`;

  dashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.base}/dashboard`);
  }

  bookings(f: BookingFilters): Observable<Paged<AdminBookingItem>> {
    return this.http.get<Paged<AdminBookingItem>>(`${this.base}/bookings`, {
      params: toParams({ ...f }),
    });
  }

  booking(id: number): Observable<AdminBookingDetailResponse> {
    return this.http.get<AdminBookingDetailResponse>(`${this.base}/bookings/${id}`);
  }

  updateBookingStatus(id: number, body: UpdateStatusRequest): Observable<unknown> {
    return this.http.post(`${this.base}/bookings/${id}/status`, body);
  }

  drivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.base}/drivers`);
  }

  quotes(f: QuoteFilters): Observable<Paged<AdminQuoteItem>> {
    return this.http.get<Paged<AdminQuoteItem>>(`${this.base}/quotes`, { params: toParams({ ...f }) });
  }

    respondToQuote(id: number, body: RespondToQuoteRequest): Observable<QuoteActionResult> {
    return this.http.post<QuoteActionResult>(`${this.base}/quotes/${id}/respond`, body);
  }

  declineQuote(id: number, adminNote: string | null): Observable<QuoteActionResult> {
    return this.http.post<QuoteActionResult>(`${this.base}/quotes/${id}/decline`, { adminNote });
  }
 
    // ---------- catalog (Admin role only) ----------
  vehicles(): Observable<CatalogVehicle[]> {
    return this.http.get<CatalogVehicle[]>(`${this.base}/catalog/vehicles`);
  }

  saveVehicle(id: number | null, body: CatalogVehicleSave): Observable<CatalogVehicle> {
    return id === null
      ? this.http.post<CatalogVehicle>(`${this.base}/catalog/vehicles`, body)
      : this.http.put<CatalogVehicle>(`${this.base}/catalog/vehicles/${id}`, body);
  }

  catalogRoutes(): Observable<CatalogRoute[]> {
    return this.http.get<CatalogRoute[]>(`${this.base}/catalog/routes`);
  }

  saveRoute(id: number | null, body: CatalogRouteSave): Observable<CatalogRoute> {
    return id === null
      ? this.http.post<CatalogRoute>(`${this.base}/catalog/routes`, body)
      : this.http.put<CatalogRoute>(`${this.base}/catalog/routes/${id}`, body);
  }

}
