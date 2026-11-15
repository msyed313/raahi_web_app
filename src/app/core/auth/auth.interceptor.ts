import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CustomerAuthService } from './customer-auth.service';
import { DriverAuthService } from '../auth/driver-auth.service';

/**
 * Adds the right JWT to protected calls and signs the user out when the API says 401:
 *  - /api/admin/*     -> admin token (except admin login)
 *  - /api/customer/*  -> customer token (except /api/customer/auth/*, which is public)
 *  - /api/driver/*    -> driver token (except /api/driver/auth/*, which is public)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const admin = inject(AuthService);
  const customer = inject(CustomerAuthService);
  const driver = inject(DriverAuthService);

  const isAdminCall =
    req.url.startsWith(`${environment.apiUrl}/api/admin`) && !req.url.endsWith('/auth/login');
  const isCustomerCall =
    req.url.startsWith(`${environment.apiUrl}/api/customer`) && !req.url.includes('/api/customer/auth/');
  const isDriverCall =
    req.url.startsWith(`${environment.apiUrl}/api/driver`) && !req.url.includes('/api/driver/auth/');

  const token = isAdminCall ? admin.token() : isCustomerCall ? customer.token() : isDriverCall ? driver.token() : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (isAdminCall) admin.logout(true);
        else if (isCustomerCall) customer.logout(true);
        else if (isDriverCall) driver.logout(true);
      }
      return throwError(() => err);
    }),
  );
};