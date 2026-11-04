import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CustomerAuthService } from './customer-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const admin = inject(AuthService);
  const customer = inject(CustomerAuthService);

  const isAdminCall =
    req.url.startsWith(`${environment.apiUrl}/api/admin`) && !req.url.endsWith('/auth/login');
  const isCustomerCall =
    req.url.startsWith(`${environment.apiUrl}/api/customer`) && !req.url.includes('/api/customer/auth/');

  const token = isAdminCall ? admin.token() : isCustomerCall ? customer.token() : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (isAdminCall) admin.logout(true);
        else if (isCustomerCall) customer.logout(true);
      }
      return throwError(() => err);
    }),
  );
};