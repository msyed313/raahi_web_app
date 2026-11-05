import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { PaymentStatus } from '../../core/models';
import { Icon } from '../../shared/icon';

const TEST_CARDS = [
  { label: 'Approved', number: '4242 4242 4242 4242' },
  { label: 'Declined', number: '4000 0000 0000 0002' },
  { label: 'No funds', number: '4000 0000 0000 9995' },
];


@Component({
  imports: [ReactiveFormsModule, DecimalPipe, Icon],
  selector: 'app-pay-sandbox',
  styles: ``,
  templateUrl: './pay-sandbox.html',
})
export class PaySandbox implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly txn = inject(ActivatedRoute).snapshot.queryParamMap.get('txn') ?? '';

  readonly testCards = TEST_CARDS;
  readonly info = signal<PaymentStatus | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  readonly form = this.fb.nonNullable.group({
    holder: ['', [Validators.required, Validators.maxLength(80)]],
    number: ['', [Validators.required, Validators.pattern(/^\d{4}( ?\d{4}){2,3}( ?\d{1,3})?$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  ngOnInit(): void {
    if (!this.txn) {
      this.loadError.set('The payment reference is missing.');
      return;
    }
    this.api.paymentStatus(this.txn).subscribe({
      next: (p) => {
        // Already paid or failed: show the outcome instead of the card form
        if (p.attemptStatus !== 'Initiated') {
          void this.router.navigate(['/payment/result'], { queryParams: { txn: this.txn }, replaceUrl: true });
          return;
        }
        this.info.set(p);
      },
      error: (err) => this.loadError.set(apiErrorMessage(err)),
    });
  }

  bad(name: 'holder' | 'number' | 'expiry' | 'cvc'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  fill(number: string): void {
    this.form.patchValue({ number, holder: this.form.controls.holder.value || 'Test Customer', expiry: '12/30', cvc: '123' });
  }

  formatNumber(): void {
    const digits = this.form.controls.number.value.replace(/\D/g, '').slice(0, 19);
    const spaced = digits.replace(/(.{4})/g, '$1 ').trim();
    if (spaced !== this.form.controls.number.value) this.form.controls.number.setValue(spaced);
  }

  formatExpiry(): void {
    const digits = this.form.controls.expiry.value.replace(/\D/g, '').slice(0, 4);
    const text = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    if (text !== this.form.controls.expiry.value) this.form.controls.expiry.setValue(text);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    // Only the card number goes to the test endpoint; expiry and CVC are never sent
    this.api.sandboxPay(this.txn, this.form.controls.number.value).subscribe({
      next: () => void this.router.navigate(['/payment/result'], { queryParams: { txn: this.txn } }),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
