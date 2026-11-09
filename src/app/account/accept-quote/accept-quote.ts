import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiErrorMessage } from '../../core/apis/api-error';
import { ApiService } from '../../core/apis/api.service';
import { CustomerAuthService, CustomerProfile, CustomerQuote } from '../../core/auth/customer-auth.service';
import { localDateTimeAhead, toApiDateTime } from '../../core/format';
import { PaymentMethod, VehicleType } from '../../core/models';
import { utc } from '../../core/status';
import { Icon, IconName } from '../../shared/icon';

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

@Component({
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, Icon],
  selector: 'app-accept-quote',
  styles: ``,
  templateUrl: './accept-quote.html',
})
export class AcceptQuote implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly auth = inject(CustomerAuthService);
  private readonly router = inject(Router);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly minHours = MIN_HOURS_AHEAD;
  readonly quote = signal<CustomerQuote | null>(null);
  readonly vehicles = signal<VehicleType[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  private profile: CustomerProfile | null = null;

  readonly paymentChoices: { value: PaymentMethod; icon: IconName; title: string; text: string }[] = [
    { value: 'Card', icon: 'credit-card', title: 'Pay online by card', text: 'Secure online card payment.' },
    { value: 'PayLater', icon: 'banknote', title: 'Pay the driver', text: 'Settle directly with the driver at pickup.' },
  ];

  readonly form = this.fb.nonNullable.group({
    pickupDateTime: ['', [Validators.required, notTooSoon]],
    vehicleTypeId: [null as number | null],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9][0-9 \-]{6,19}$/)]],
    flightNumber: ['', [flightNumber]],
    notes: ['', [Validators.maxLength(1000)]],
    paymentMethod: ['Card' as PaymentMethod, Validators.required],
  });

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({ quotes: this.auth.quotes(), profile: this.auth.profile() }).subscribe({
      next: ({ quotes, profile }) => {
        this.profile = profile;
        const q = quotes.find((x) => x.quoteId === this.id) ?? null;
        this.quote.set(q);
        this.loading.set(false);
        if (!q) {
          this.error.set('We could not find this quote.');
          return;
        }

        this.form.patchValue({
          phone: profile.phone,
          flightNumber: q.flightNumber ?? '',
          notes: q.notes ?? '',
          // the customer's own wish if it is still far enough ahead, otherwise they pick a new time
          pickupDateTime: this.suggestedTime(q),
        });

        // an admin may not have fixed the vehicle: then the customer chooses one that fits the group
        if (q.vehicleTypeId === null) {
          this.form.controls.vehicleTypeId.setValidators([Validators.required]);
          this.form.controls.vehicleTypeId.updateValueAndValidity();
          this.api.vehicleTypes(q.passengers, q.luggage).subscribe({ next: (v) => this.vehicles.set(v), error: () => undefined });
        }
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  usable(): boolean {
    const q = this.quote();
    if (!q || q.status !== 'Quoted') return false;
    const e = utc(q.expiresAtUtc);
    return !e || new Date(e).getTime() > Date.now();
  }

  minNow(): string {
    return localDateTimeAhead(MIN_HOURS_AHEAD);
  }

  private suggestedTime(q: CustomerQuote): string {
    if (!q.pickupDateTime) return '';
    const local = q.pickupDateTime.slice(0, 16);
    return local >= localDateTimeAhead(MIN_HOURS_AHEAD) ? local : '';
  }

  bad(name: 'pickupDateTime' | 'vehicleTypeId' | 'phone' | 'flightNumber'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(event: Event): void {
    event.preventDefault();
    this.form.markAllAsTouched();
    const q = this.quote();
    if (!q || !this.profile || this.form.invalid || this.submitting()) return;

    const v = this.form.getRawValue();
    const vehicleTypeId = q.vehicleTypeId ?? v.vehicleTypeId;
    if (vehicleTypeId === null) return;

    this.error.set(null);
    this.submitting.set(true);
    this.api
      .createBooking({
        fullName: this.profile.fullName,
        email: this.profile.email,
        phone: v.phone.trim(),
        pickupAddress: q.pickupAddress,
        dropoffAddress: q.dropoffAddress,
        pickupDateTime: toApiDateTime(v.pickupDateTime),
        passengers: q.passengers,
        luggage: q.luggage,
        flightNumber: v.flightNumber.trim() || null,
        notes: v.notes.trim() || null,
        vehicleTypeId,
        routeId: null,
        distanceKm: null,
        quoteId: q.quoteId,
        paymentMethod: v.paymentMethod,
      })
      .subscribe({
        next: (booking) => void this.router.navigate(['/confirmation'], { state: { booking } }),
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.submitting.set(false);
        },
      });
  }
}
