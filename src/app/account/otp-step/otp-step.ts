import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { CustomerAuthService, OtpPurpose } from '../../core/customer-auth.service';
import { Icon } from '../../shared/icon';
@Component({
  imports: [ReactiveFormsModule, Icon],
  selector: 'app-otp-step',
  styles: ``,
  templateUrl: './otp-step.html',
})
export class OtpStep implements OnInit {
  private readonly auth = inject(CustomerAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = input.required<string>();
  readonly purpose = input.required<OtpPurpose>();
  readonly resendAfter = input(60);

  /** Emits the short-lived setup token once the code is correct. */
  readonly verified = output<string>();
  readonly changeEmail = output<void>();

  readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });
  readonly busy = signal(false);
  readonly resending = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);
  readonly remaining = signal(0);

  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    this.destroyRef.onDestroy(() => clearInterval(this.timer));
  }

  ngOnInit(): void {
    this.startCountdown(this.resendAfter());
  }

  clean(): void {
    const digits = this.code.value.replace(/\D/g, '').slice(0, 6);
    if (digits !== this.code.value) this.code.setValue(digits);
  }
onSubmit(event: Event): void {
  // This form has no [formGroup], so Angular does not stop the browser's own submit (a full page reload)
  event.preventDefault();
  this.submit();
}
  submit(): void {
    if (this.busy()) return;
    if (this.code.invalid) {
      this.error.set('Enter the 6-digit code from your email.');
      return;
    }
    this.error.set(null);
    this.info.set(null);
    this.busy.set(true);
    
    this.auth.verifyOtp(this.email(), this.purpose(), this.code.value).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.verified.emit(r.setupToken);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }

  resend(): void {
    this.error.set(null);
    this.info.set(null);
    this.resending.set(true);
    this.auth.requestOtp(this.purpose(), this.email()).subscribe({
      next: (r) => {
        this.resending.set(false);
        this.code.reset('');
        this.info.set('A new code is on its way.');
        this.startCountdown(r.resendAfterSeconds);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.resending.set(false);
      },
    });
  }

  private startCountdown(seconds: number): void {
    clearInterval(this.timer);
    this.remaining.set(seconds);
    this.timer = setInterval(() => {
      this.remaining.update((n) => Math.max(0, n - 1));
      if (this.remaining() === 0) clearInterval(this.timer);
    }, 1000);
  }
}
