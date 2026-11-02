import { Routes } from '@angular/router';

export const routes: Routes = [
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
  // Admin routes (/admin/...) are added in the next step.
  { path: '**', redirectTo: '' },
];
