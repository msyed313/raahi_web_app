import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
   import { customerGuard } from './core/auth/customer.guard';
import { driverGuard } from './core/auth/driver.guard';
export const routes: Routes = [
  // ---------- admin ----------
  {
    path: 'admin/login',
    title: 'Admin sign in - Raahi',
    loadComponent: () => import('./admin/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard - Raahi Admin',
        loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'bookings',
        title: 'Bookings - Raahi Admin',
        loadComponent: () => import('./admin/bookings-list/bookings-list').then((m) => m.BookingsList),
      },
      {
        path: 'bookings/:id',
        title: 'Booking - Raahi Admin',
        loadComponent: () => import('./admin/booking-detail/booking-detail').then((m) => m.BookingDetail),
      },
      {
        path: 'quotes',
        title: 'Quotes - Raahi Admin',
        loadComponent: () => import('./admin/quotes/quotes').then((m) => m.Quotes),
      },
            {
        path: 'vehicles',
        title: 'Vehicles - Raahi Admin',
        loadComponent: () => import('./admin/vehicles/vehicles').then((m) => m.Vehicles),
      },
      {
        path: 'routes',
        title: 'Routes & prices - Raahi Admin',
        loadComponent: () => import('./admin/routes/routes').then((m) => m.RoutesAdmin),
      },
            {
        path: 'drivers',
        title: 'Drivers - Raahi Admin',
        loadComponent: () => import('./admin/drivers').then((m) => m.DriversAdmin),
      },
      {
        path: 'drivers/:id',
        title: 'Driver - Raahi Admin',
        loadComponent: () => import('./admin/driver-detail/driver-detail').then((m) => m.DriverDetailAdmin),
      },
    ],
  },
     // ---------- driver portal ----------
  {
    path: 'driver',
    canActivate: [driverGuard],
    loadComponent: () => import('../app/driver/driver-shell/driver-shell').then((m) => m.DriverShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'jobs' },
      {
        path: 'jobs',
        title: 'My jobs - Raahi Driver',
        loadComponent: () => import('../app/driver/driver-jobs/driver-jobs').then((m) => m.DriverJobsPage),
      },
      {
        path: 'profile',
        title: 'My profile - Raahi Driver',
        loadComponent: () => import('../app/driver/driver-profile/driver-profile').then((m) => m.DriverProfilePage),
      },
    ],
  },
  // ---------- public site ----------
  {
    path: '',
    loadComponent: () => import('./layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        title: 'Raahi - Book a ride',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'book',
        title: 'Book a Ride - Raahi',
        loadComponent: () => import('./pages/booking/booking').then((m) => m.Booking),
      },
      {
        path: 'quote',
        title: 'Request a Quote - Raahi',
        loadComponent: () => import('./pages/quote/quote').then((m) => m.Quote),
      },
      {
        path: 'confirmation',
        title: 'Booking confirmation - Raahi',
        loadComponent: () => import('./pages/confirmation/confirmation').then((m) => m.Confirmation),
      },
            {
        path: 'driver/login',
        title: 'Driver log in - Raahi',
        loadComponent: () => import('../app/driver/driver-login/driver-login').then((m) => m.DriverLogin),
      },
      {
        path: 'driver/signup',
        title: 'Drive with Raahi',
        loadComponent: () => import('../app/driver/driver-signup/driver-signup').then((m) => m.DriverSignup),
      },
      {
        path: 'driver/forgot',
        title: 'Reset driver password - Raahi',
        loadComponent: () => import('../app/driver/driver-forgot/driver-forgot').then((m) => m.DriverForgot),
      },
   {
     path: 'account/signup',
     title: 'Create account - Raahi',
     loadComponent: () => import('./account/signup/signup').then((m) => m.Signup),
   },
   {
     path: 'account/login',
     title: 'Log in - Raahi',
     loadComponent: () => import('./account/login/login').then((m) => m.Login),
   },
   {
     path: 'account/forgot',
     title: 'Reset password - Raahi',
     loadComponent: () => import('./account/forgot-password').then((m) => m.ForgotPassword),
   },
   {
     path: 'account/profile',
     title: 'My account - Raahi',
     canActivate: [customerGuard],
     loadComponent: () => import('./account/profile/profile').then((m) => m.Profile),
   },
     {
        path: 'account/quotes',
        title: 'My quotes - Raahi',
        canActivate: [customerGuard],
        loadComponent: () => import('./account/my-quotes/my-quotes').then((m) => m.MyQuotes),
      },
    {
        path: 'account/quotes/:id/book',
        title: 'Book your quote - Raahi',
        canActivate: [customerGuard],
        loadComponent: () => import('./account/accept-quote/accept-quote').then((m) => m.AcceptQuote),
      },
      {
        path: 'account/rides/:id',
        title: 'Ride details - Raahi',
        canActivate: [customerGuard],
        loadComponent: () => import('./account/ride-detail/ride-detail').then((m) => m.RideDetail),
      },
      {
         path: 'account/rides',
         title: 'My rides - Raahi',
         canActivate: [customerGuard],
         loadComponent: () => import('./account/my-rides').then((m) => m.MyRides),
      },
      {
        path: 'pay/sandbox',
        title: 'Test payment - Raahi',
        loadComponent: () => import('./account/pay-sandbox/pay-sandbox').then((m) => m.PaySandbox),
      },
      {
        path: 'payment/result',
        title: 'Payment - Raahi',
        loadComponent: () => import('./account/payment-result/payment-result').then((m) => m.PaymentResult),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
