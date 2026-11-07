import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/apis/api-error';
import { ApiService } from '../../core/apis/api.service';
import { isAirport, localDateTimeAhead, toApiDateTime } from '../../core/format';
import {
  CreateBookingRequest,
  GeoPoint,
  PaymentMethod,
  PlaceSuggestion,
  PriceResult,
  RouteItem,
  VehicleType,
} from '../../core/models';
import { Icon, IconName } from '../../shared/icon';
   import { CustomerAuthService } from '../../core/auth/customer-auth.service';
import { AddressInput } from '../../shared/address-input';


interface VehicleOption {
  vehicle: VehicleType;
  price: PriceResult | null; // null = this vehicle has no price for the chosen trip
}

/** Keep in sync with the server setting MinAdvanceBookingHours (default 2). The API still has the final say. */
const MIN_HOURS_AHEAD = 2;

function notTooSoon(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  return value && value < localDateTimeAhead(MIN_HOURS_AHEAD) ? { tooSoon: true } : null;
}

function flightNumber(control: AbstractControl): ValidationErrors | null {
  const value = ((control.value as string) ?? '').replace(/\s+/g, '');
  return value === '' || /^[A-Za-z0-9]{3,8}$/.test(value) ? null : { flight: true };
}

const PHONE = /^\+?[0-9][0-9 \-]{6,19}$/;

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, DatePipe, Icon, AddressInput],
  templateUrl: './booking.html',
})
export class Booking implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
   private readonly customerAuth = inject(CustomerAuthService);
   readonly loggedIn = this.customerAuth.session;
  readonly steps = [
    { n: 1, label: 'Trip' },
    { n: 2, label: 'Vehicle' },
    { n: 3, label: 'Confirm' },
  ];

  readonly paymentChoices: { value: PaymentMethod; icon: IconName; title: string; text: string }[] = [
    { value: 'Card', icon: 'credit-card', title: 'Pay online by card', text: 'Secure online card payment.' },
    { value: 'PayLater', icon: 'banknote', title: 'Pay the driver', text: 'Settle directly with the driver at pickup.' },
  ];

  readonly step = signal(1);
  readonly mode = signal<'route' | 'custom'>('route');
  readonly routes = signal<RouteItem[]>([]);
  readonly options = signal<VehicleOption[]>([]);
  readonly selected = signal<VehicleOption | null>(null);
  readonly loadingOptions = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
    // address search: coordinates of the chosen suggestions, and the automatic distance
  private readonly points: { pickup: GeoPoint | null; dropoff: GeoPoint | null } = { pickup: null, dropoff: null };
  readonly distanceAuto = signal(false);
  readonly distanceBusy = signal(false);
  readonly trip = this.fb.nonNullable.group({
    routeId: [null as number | null],
    pickupAddress: ['', [Validators.required, Validators.maxLength(300)]],
    dropoffAddress: ['', [Validators.required, Validators.maxLength(300)]],
    distanceKm: [null as number | null],
    pickupDateTime: ['', [Validators.required, notTooSoon]],
    passengers: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    luggage: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    flightNumber: ['', [flightNumber]],
    notes: ['', [Validators.maxLength(1000)]],
  });

  readonly contact = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE)]],
    paymentMethod: ['Card' as PaymentMethod, Validators.required],
  });

  constructor() {
    this.setMode('route');
  }

  ngOnInit(): void {
        if (this.customerAuth.isValid()) {
     this.customerAuth.profile().subscribe({
       next: (p) =>
         this.contact.patchValue({
           fullName: p.fullName,
           email: p.email,
           phone: p.phone || this.contact.controls.phone.value,
         }),
       error: () => {
         /* not critical: the customer can type their details */
       },
     });
   }

    this.api.routes().subscribe({
      next: (routes) => {
        this.routes.set(routes);
        // Preselect a route when arriving from a "Popular routes" card (/book?route=1)
        const id = Number(this.route.snapshot.queryParamMap.get('route'));
        if (id && routes.some((r) => r.id === id)) {
          this.trip.controls.routeId.setValue(id);
          this.fillAddressesFromRoute();
        }
      },
      error: () => this.routes.set([]),
    });
  }

    // ---------- address search ----------
  setPoint(which: 'pickup' | 'dropoff', place: PlaceSuggestion): void {
    this.points[which] = { lat: place.lat, lon: place.lon };
    this.updateDistance();
  }

  clearPoint(which: 'pickup' | 'dropoff'): void {
    if (!this.points[which] && !this.distanceAuto()) return;
    this.points[which] = null;
    if (this.distanceAuto()) {
      this.distanceAuto.set(false);
      if (this.mode() === 'custom') this.trip.controls.distanceKm.setValue(null);
    }
  }

  private updateDistance(): void {
    const { pickup, dropoff } = this.points;
    if (this.mode() !== 'custom' || !pickup || !dropoff) return;

    this.distanceBusy.set(true);
    this.api.drivingDistance(pickup, dropoff).subscribe({
      next: (r) => {
        this.trip.controls.distanceKm.setValue(r.distanceKm);
        this.distanceAuto.set(true);
        this.distanceBusy.set(false);
      },
      error: () => {
        // the service is down: the customer can still type the distance by hand
        this.distanceAuto.set(false);
        this.distanceBusy.set(false);
      },
    });
  }


  // ---------- helpers used by the template ----------
  minNow(): string {
    return localDateTimeAhead(MIN_HOURS_AHEAD);
  }

  selectedRoute(): RouteItem | undefined {
    const id = this.trip.controls.routeId.value;
    return this.routes().find((r) => r.id === id);
  }

  isSelected(option: VehicleOption): boolean {
    return this.selected()?.vehicle.id === option.vehicle.id;
  }

  /** Error text for a control once the user has touched it, otherwise null. */
  err(group: AbstractControl, name: string): string | null {
    const c = group.get(name);
    if (!c || !c.invalid || !(c.touched || c.dirty)) return null;
    const e = c.errors ?? {};
    if (e['required']) return 'This field is required';
    if (e['email']) return 'Enter a valid email address';
    if (e['pattern']) return name === 'phone' ? 'Enter a valid phone number' : 'Invalid format';
    if (e['tooSoon']) return `Choose a time at least ${MIN_HOURS_AHEAD} hours from now`;
    if (e['flight']) return 'Check the flight number (example: PK301)';
    if (e['min']) return `Must be at least ${e['min'].min}`;
    if (e['max']) return `Must be at most ${e['max'].max}`;
    if (e['maxlength']) return 'Too long';
    return 'Invalid value';
  }

  bad(group: AbstractControl, name: string): boolean {
    return this.err(group, name) !== null;
  }

  // ---------- step 1: trip ----------
  setMode(mode: 'route' | 'custom'): void {
    this.mode.set(mode);
    const { routeId, distanceKm } = this.trip.controls;
    if (mode === 'route') {
      routeId.setValidators([Validators.required]);
      distanceKm.clearValidators();
    } else {
      routeId.clearValidators();
      distanceKm.setValidators([Validators.required, Validators.min(0.1), Validators.max(5000)]);
    }
    routeId.updateValueAndValidity();
    distanceKm.updateValueAndValidity();
    this.options.set([]);
    this.selected.set(null);
    if (mode === 'custom') this.updateDistance();
  }

  fillAddressesFromRoute(): void {
    const r = this.selectedRoute() ?? this.routes().find((x) => x.id === this.trip.controls.routeId.value);
    if (!r) return;
    const { pickupAddress, dropoffAddress } = this.trip.controls;
    if (!pickupAddress.value) pickupAddress.setValue(r.pickupLabel);
    if (!dropoffAddress.value) dropoffAddress.setValue(r.dropoffLabel);
  }

  onRouteChange(): void {
    this.fillAddressesFromRoute();
    this.options.set([]);
    this.selected.set(null);
  }

  bump(field: 'passengers' | 'luggage', delta: number): void {
    const control = this.trip.controls[field];
    const min = field === 'passengers' ? 1 : 0;
    control.setValue(Math.min(50, Math.max(min, (Number(control.value) || min) + delta)));
    control.markAsDirty();
  }

  goToVehicles(): void {
    this.trip.markAllAsTouched();
    if (this.trip.invalid) return;
    this.error.set(null);

    const t = this.trip.getRawValue();
    const route = this.mode() === 'route' ? this.selectedRoute() : undefined;
    const airport = isAirport(t.pickupAddress) || isAirport(route?.pickupLabel);
    const pickup = toApiDateTime(t.pickupDateTime);

    this.loadingOptions.set(true);
    this.api
      .vehicleTypes(t.passengers, t.luggage)
      .pipe(
        switchMap((vehicles) =>
          vehicles.length === 0
            ? of<VehicleOption[]>([])
            : forkJoin(
                vehicles.map((vehicle) =>
                  this.api
                    .calculatePrice({
                      vehicleTypeId: vehicle.id,
                      pickupDateTime: pickup,
                      routeId: this.mode() === 'route' ? t.routeId : null,
                      distanceKm: this.mode() === 'custom' ? t.distanceKm : null,
                      isAirportPickup: airport,
                    })
                    .pipe(
                      map((price): VehicleOption => ({ vehicle, price })),
                      catchError(() => of<VehicleOption>({ vehicle, price: null })),
                    ),
                ),
              ),
        ),
      )
      .subscribe({
        next: (options) => {
          const keep = options.find((o) => o.price && o.vehicle.id === this.selected()?.vehicle.id);
          this.options.set(options);
          this.selected.set(keep ?? null);
          this.loadingOptions.set(false);
          this.step.set(2);
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.loadingOptions.set(false);
        },
      });
  }

  // ---------- step 2: vehicle ----------
  choose(option: VehicleOption): void {
    if (option.price) this.selected.set(option);
  }

  // ---------- navigation ----------
  goTo(step: number): void {
    this.error.set(null);
    this.step.set(step);
  }

  next(): void {
    if (this.step() === 2 && this.selected()) this.goTo(3);
  }

  // ---------- step 3: confirm ----------
  submit(): void {
    this.contact.markAllAsTouched();
    const chosen = this.selected();
    if (this.contact.invalid || !chosen || this.submitting()) return;

    const t = this.trip.getRawValue();
    const c = this.contact.getRawValue();
    const body: CreateBookingRequest = {
      fullName: c.fullName.trim(),
      email: c.email.trim(),
      phone: c.phone.trim(),
      pickupAddress: t.pickupAddress.trim(),
      dropoffAddress: t.dropoffAddress.trim(),
      pickupDateTime: toApiDateTime(t.pickupDateTime),
      passengers: t.passengers,
      luggage: t.luggage,
      flightNumber: t.flightNumber.trim() || null,
      notes: t.notes.trim() || null,
      vehicleTypeId: chosen.vehicle.id,
      routeId: this.mode() === 'route' ? t.routeId : null,
      distanceKm: this.mode() === 'custom' ? t.distanceKm : null,
      quoteId: null,
      paymentMethod: c.paymentMethod,
    };

    this.error.set(null);
    this.submitting.set(true);
    this.api.createBooking(body).subscribe({
      next: (booking) => this.router.navigate(['/confirmation'], { state: { booking } }),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.submitting.set(false);
      },
    });
  }
}
