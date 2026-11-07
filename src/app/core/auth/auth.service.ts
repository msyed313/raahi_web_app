import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { utc } from '../status';

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  fullName: string;
  role: string;
}

const STORAGE_KEY = 'raahi.admin.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<LoginResponse | null>(this.read());
  readonly session = this._session.asReadonly();

  token(): string | null {
    return this.isValid() ? this._session()!.token : null;
  }

  /** True while a session exists and its token has not expired. */
  isValid(): boolean {
    const s = this._session();
    return !!s && new Date(utc(s.expiresAtUtc)!).getTime() > Date.now();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/AdminAuth/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this._session.set(res);
          this.write(res);
        }),
      );
  }

  logout(expired = false): void {
    this._session.set(null);
    this.write(null);
    void this.router.navigate(['/admin/login'], expired ? { queryParams: { expired: 1 } } : {});
  }

  // sessionStorage can throw (private mode, blocked storage); the app must still work without it.
  private read(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }

  private write(value: LoginResponse | null): void {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
