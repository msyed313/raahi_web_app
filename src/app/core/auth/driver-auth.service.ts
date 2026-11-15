import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OtpPurpose } from './customer-auth.service';
import { utc } from '../status';

export type DriverStatus = 'Incomplete' | 'Pending' | 'Approved' | 'Rejected';

export interface DriverSession {
  token: string;
  expiresAtUtc: string;
  fullName: string;
  email: string;
  approvalStatus: DriverStatus;
}

const BASE = `${environment.apiUrl}/api/driver/auth`;
const STORAGE_KEY = 'raahi.driver.session';

@Injectable({ providedIn: 'root' })
export class DriverAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<DriverSession | null>(this.read());
  readonly session = this._session.asReadonly();

  token(): string | null {
    return this.isValid() ? this._session()!.token : null;
  }

  isValid(): boolean {
    const s = this._session();
    return !!s && new Date(utc(s.expiresAtUtc)!).getTime() > Date.now();
  }

  requestOtp(purpose: OtpPurpose, email: string): Observable<{ message: string; resendAfterSeconds: number }> {
    const path = purpose === 'SignUp' ? 'signup/request-otp' : 'forgot/request-otp';
    return this.http.post<{ message: string; resendAfterSeconds: number }>(`${BASE}/${path}`, { email });
  }

  verifyOtp(email: string, purpose: OtpPurpose, code: string): Observable<{ setupToken: string; expiresInSeconds: number }> {
    return this.http.post<{ setupToken: string; expiresInSeconds: number }>(`${BASE}/verify-otp`, { email, purpose, code });
  }

  completeSignUp(setupToken: string, fullName: string, phone: string, password: string): Observable<DriverSession> {
    return this.http
      .post<DriverSession>(`${BASE}/signup/complete`, { setupToken, fullName, phone, password })
      .pipe(tap((s) => this.setSession(s)));
  }

  completeReset(setupToken: string, password: string): Observable<void> {
    return this.http.post<void>(`${BASE}/reset/complete`, { setupToken, password });
  }

  login(email: string, password: string): Observable<DriverSession> {
    return this.http.post<DriverSession>(`${BASE}/login`, { email, password }).pipe(tap((s) => this.setSession(s)));
  }

  /** Keeps the menu in step with the application status without a new login. */
  updateStatus(status: DriverStatus, fullName?: string): void {
    const s = this._session();
    if (s && (s.approvalStatus !== status || (fullName && s.fullName !== fullName))) {
      this.setSession({ ...s, approvalStatus: status, fullName: fullName ?? s.fullName });
    }
  }

  logout(expired = false): void {
    this._session.set(null);
    this.write(null);
    void this.router.navigate(['/driver/login'], expired ? { queryParams: { expired: 1 } } : {});
  }

  private setSession(s: DriverSession): void {
    this._session.set(s);
    this.write(s);
  }

  private read(): DriverSession | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const s = raw ? (JSON.parse(raw) as DriverSession) : null;
      return s && new Date(utc(s.expiresAtUtc)!).getTime() > Date.now() ? s : null;
    } catch {
      return null;
    }
  }

  private write(value: DriverSession | null): void {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}