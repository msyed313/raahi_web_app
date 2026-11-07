import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
   import { customerGuard } from './core/auth/customer.guard';
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
