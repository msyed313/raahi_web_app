import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerAuthService } from './customer-auth.service';

export const customerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(CustomerAuthService);
  const router = inject(Router);
  return auth.isValid()
    ? true
    : router.createUrlTree(['/account/login'], { queryParams: { returnUrl: state.url } });
};