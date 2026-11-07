import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { utc } from '../status';

export type OtpPurpose = 'SignUp' | 'ResetPassword';

export interface CustomerSession {
  token: string;
  expiresAtUtc: string;
  fullName: string;
  email: string;
}

export interface CustomerProfile {
  fullName: string;
  email: string;
  phone: string;
  defaultPickupAddress: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
  createdAtUtc: string;
}

export interface UpdateProfile {
  fullName: string;
  phone: string | null;
  defaultPickupAddress: string | null;
}

export interface OtpSent {
  message: string;
  resendAfterSeconds: number;
}

export interface Providers {
  googleEnabled: boolean;
  googleClientId: string;
}

export interface CustomerRide {
  bookingId: number;
  bookingRef: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  pickupDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleType: string;
  passengers: number;
  totalAmount: number;
  currency: string;
  driverName: string | null;
  driverPhone: string | null;
  driverPlate: string | null;
}

export interface CustomerQuote {
  quoteId: number;
  quoteRef: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDateTime: string | null;
  passengers: number;
  vehicleType: string | null;
  quotedAmount: number | null;
  currency: string;
  adminNote: string | null;
  quotedAtUtc: string | null;
  expiresAtUtc: string | null;
  createdAtUtc: string;
}


const BASE = `${environment.apiUrl}/api/customer`;
const STORAGE_KEY = 'raahi.customer.session';

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<CustomerSession | null>(this.read());
  readonly session = this._session.asReadonly();

  private providers$?: Observable<Providers>;

  token(): string | null {
    return this.isValid() ? this._session()!.token : null;
  }

  isValid(): boolean {
    const s = this._session();
    return !!s && new Date(utc(s.expiresAtUtc)!).getTime() > Date.now();
  }

  // ---------- public (no token needed) ----------
  providers(): Observable<Providers> {
    return (this.providers$ ??= this.http.get<Providers>(`${BASE}/auth/providers`).pipe(shareReplay(1)));
  }
    quotes(): Observable<CustomerQuote[]> {
    return this.http.get<CustomerQuote[]>(`${BASE}/me/quotes`);
  }
  requestOtp(purpose: OtpPurpose, email: string): Observable<OtpSent> {
    const path = purpose === 'SignUp' ? 'signup/request-otp' : 'forgot/request-otp';
    return this.http.post<OtpSent>(`${BASE}/auth/${path}`, { email });
  }

  verifyOtp(email: string, purpose: OtpPurpose, code: string): Observable<{ setupToken: string; expiresInSeconds: number }> {
    return this.http.post<{ setupToken: string; expiresInSeconds: number }>(`${BASE}/auth/verify-otp`, {
      email,
      purpose,
      code,
    });
  }

  completeSignUp(setupToken: string, fullName: string, password: string): Observable<CustomerSession> {
    return this.http
      .post<CustomerSession>(`${BASE}/auth/signup/complete`, { setupToken, fullName, password })
      .pipe(tap((s) => this.setSession(s)));
  }

  completeReset(setupToken: string, password: string): Observable<void> {
    return this.http.post<void>(`${BASE}/auth/reset/complete`, { setupToken, password });
  }

  login(email: string, password: string): Observable<CustomerSession> {
    return this.http
      .post<CustomerSession>(`${BASE}/auth/login`, { email, password })
      .pipe(tap((s) => this.setSession(s)));
  }

  google(idToken: string): Observable<CustomerSession> {
    return this.http.post<CustomerSession>(`${BASE}/auth/google`, { idToken }).pipe(tap((s) => this.setSession(s)));
  }

  // ---------- signed-in customer ----------
  profile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${BASE}/me`);
  }

  updateProfile(body: UpdateProfile): Observable<CustomerProfile> {
    return this.http.put<CustomerProfile>(`${BASE}/me`, body).pipe(
      tap((p) => {
        const s = this._session();
        if (s) this.setSession({ ...s, fullName: p.fullName });
      }),
    );
  }
    rides(): Observable<CustomerRide[]> {
    return this.http.get<CustomerRide[]>(`${BASE}/me/bookings`);
  }
  changePassword(currentPassword: string | null, newPassword: string): Observable<void> {
    return this.http.post<void>(`${BASE}/me/change-password`, { currentPassword, newPassword });
  }

  logout(expired = false): void {
    this._session.set(null);
    this.write(null);
    void this.router.navigate(expired ? ['/account/login'] : ['/'], expired ? { queryParams: { expired: 1 } } : {});
  }

  private setSession(s: CustomerSession): void {
    this._session.set(s);
    this.write(s);
  }

  // sessionStorage can throw (private mode, blocked storage); the app must still work without it.
  private read(): CustomerSession | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const s = raw ? (JSON.parse(raw) as CustomerSession) : null;
      return s && new Date(utc(s.expiresAtUtc)!).getTime() > Date.now() ? s : null;
    } catch {
      return null;
    }
  }

  private write(value: CustomerSession | null): void {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}