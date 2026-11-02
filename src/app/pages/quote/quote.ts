import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { toApiDateTime } from '../../core/format';
import { CreateQuoteRequest, QuoteCreated, VehicleType } from '../../core/models';
import { Icon } from '../../shared/icon';

function flightNumber(control: AbstractControl): ValidationErrors | null {
  const value = ((control.value as string) ?? '').replace(/\s+/g, '');
  return value === '' || /^[A-Za-z0-9]{3,8}$/.test(value) ? null : { flight: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  selector: 'app-quote',
  styles: ``,
  templateUrl: './quote.html',
})


export class Quote implements OnInit {
   
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly vehicles = signal<VehicleType[]>([]);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly done = signal<QuoteCreated | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9][0-9 \-]{6,19}$/)]],
    pickupAddress: ['', [Validators.required, Validators.maxLength(300)]],
    dropoffAddress: ['', [Validators.required, Validators.maxLength(300)]],
    pickupDateTime: [''],
    vehicleTypeId: [null as number | null],
    passengers: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    luggage: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
    flightNumber: ['', [flightNumber]],
    notes: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.api.vehicleTypes().subscribe({ next: (v) => this.vehicles.set(v), error: () => undefined });
  }

  err(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.invalid || !(c.touched || c.dirty)) return null;
    const e = c.errors ?? {};
    if (e['required']) return 'This field is required';
    if (e['email']) return 'Enter a valid email address';
    if (e['pattern']) return 'Enter a valid phone number';
    if (e['flight']) return 'Check the flight number (example: PK301)';
    if (e['maxlength']) return 'Too long';
    return 'Invalid value';
  }

  bad(name: string): boolean {
    return this.err(name) !== null;
  }

  bump(field: 'passengers' | 'luggage', delta: number): void {
    const control = this.form.controls[field];
    const min = field === 'passengers' ? 1 : 0;
    control.setValue(Math.min(50, Math.max(min, (Number(control.value) || min) + delta)));
    control.markAsDirty();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const v = this.form.getRawValue();
    const body: CreateQuoteRequest = {
      fullName: v.fullName.trim(),
      email: v.email.trim(),
      phone: v.phone.trim(),
      pickupAddress: v.pickupAddress.trim(),
      dropoffAddress: v.dropoffAddress.trim(),
      pickupDateTime: v.pickupDateTime ? toApiDateTime(v.pickupDateTime) : null,
      passengers: v.passengers,
      luggage: v.luggage,
      flightNumber: v.flightNumber.trim() || null,
      notes: v.notes.trim() || null,
      vehicleTypeId: v.vehicleTypeId,
    };

    this.error.set(null);
    this.submitting.set(true);
    this.api.createQuote(body).subscribe({
      next: (q) => {
        this.done.set(q);
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.submitting.set(false);
      },
    });
  }

}
