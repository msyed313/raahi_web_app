import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/apis/api-error';
import { CustomerAuthService, CustomerRideDetail } from '../../core/auth/customer-auth.service';
import { bookingStatusClass, paymentLabel, paymentStatusClass, statusLabel, utc } from '../../core/status';
import { Icon } from '../../shared/icon';

const CANCEL_REASONS = [
  'My plans changed',
  'I found another ride',
  'I booked by mistake',
  'Wrong pickup details',
  'My flight changed or was cancelled',
  'Other',
];

@Component({
  imports: [RouterLink, DatePipe, DecimalPipe, ReactiveFormsModule, Icon],
  selector: 'app-ride-detail',
  styles: ``,
  templateUrl: './ride-detail.html',
})
export class RideDetail implements OnInit {
  private readonly auth = inject(CustomerAuthService);
  private readonly fb = inject(FormBuilder);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly reasons = CANCEL_REASONS;
  readonly ride = signal<CustomerRideDetail | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);
  readonly cancelling = signal(false);
  readonly rating = signal(0);
  readonly comment = signal('');

  readonly statusClass = bookingStatusClass;
  readonly payClass = paymentStatusClass;
  readonly payLabel = paymentLabel;
  readonly label = statusLabel;
  readonly utcDate = utc;

  readonly cancelForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
    details: [''],
  });

  ngOnInit(): void {
    // "Other" needs a written explanation; the other reasons do not
    this.cancelForm.controls.reason.valueChanges.subscribe((reason) => {
      const details = this.cancelForm.controls.details;
      details.setValidators(reason === 'Other' ? [Validators.required, Validators.minLength(3)] : []);
      details.updateValueAndValidity();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.auth.ride(this.id).subscribe({
      next: (r) => {
        this.ride.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 404 ? 'We could not find this ride.' : apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  /** Pickup times are local wall-clock times with no timezone, so the browser reads them as local. */
  pickup(r: CustomerRideDetail): Date {
    return new Date(r.pickupDateTime);
  }

  /** The cancel deadline is also a local wall-clock time. */
  utcLocal(value: string | null): Date | null {
    return value ? new Date(value) : null;
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  confirmCancel(event: Event): void {
    event.preventDefault();
    this.cancelForm.markAllAsTouched();
    if (this.cancelForm.invalid || this.busy()) return;

    const { reason, details } = this.cancelForm.getRawValue();
    const text = (details.trim() ? `${reason}: ${details.trim()}` : reason).slice(0, 250);

    this.busy.set(true);
    this.error.set(null);
    this.auth.cancelRide(this.id, text).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.cancelling.set(false);
        this.flash.set(res.refundPending ? 'Your ride is cancelled. We will contact you about your refund.' : 'Your ride is cancelled.');
        this.load();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
        this.load(); // the window may have just closed
      },
    });
  }

  submitFeedback(): void {
    if (!this.rating() || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.sendFeedback(this.id, this.rating(), this.comment().trim() || null).subscribe({
      next: () => {
        this.busy.set(false);
        this.flash.set('Thank you for your feedback.');
        this.load();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }
}