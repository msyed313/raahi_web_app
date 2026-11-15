import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DriverAuthService } from './driver-auth.service';

export const driverGuard: CanActivateFn = () => {
  const auth = inject(DriverAuthService);
  return auth.isValid() ? true : inject(Router).createUrlTree(['/driver/login']);
};