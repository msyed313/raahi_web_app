import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OtpStep } from '../../account/otp-step/otp-step';
import { apiErrorMessage } from '../../core/apis/api-error';
import { DriverAuthService } from '../../core/auth/driver-auth.service';
import { passwordRule, passwordsMatch } from '../../core/password';
import { Icon } from '../../shared/icon';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon, OtpStep],
  selector: 'app-driver-signup',
  styles: ``,
  templateUrl: './driver-signup.html',
})
export class DriverSignup {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(DriverAuthService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2 | 3>(1);
  readonly email = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly exists = signal(false);
  private setupToken = '';

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
  });

  readonly detailsForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9][0-9 \-]{6,19}$/)]],
      password: ['', [Validators.required, passwordRule]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    if (this.auth.isValid()) void this.router.navigateByUrl('/driver');
  }

  emailInvalid(): boolean {
    const c = this.emailForm.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  bad(name: 'fullName' | 'phone' | 'password'): boolean {
    const c = this.detailsForm.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    const c = this.detailsForm.controls.confirm;
    return this.detailsForm.hasError('mismatch') && (c.touched || c.dirty);
  }

  sendCode(event: Event): void {
    event.preventDefault();
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.busy()) return;

    this.error.set(null);
    this.exists.set(false);
    this.busy.set(true);
    const email = this.emailForm.controls.email.value.trim().toLowerCase();
    this.auth.requestOtp('SignUp', email).subscribe({
      next: () => {
        this.email.set(email);
        this.step.set(2);
        this.busy.set(false);
      },
      error: (err) => {
        this.exists.set(err?.status === 409);
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }

  onVerified(setupToken: string): void {
    this.setupToken = setupToken;
    this.error.set(null);
    this.step.set(3);
  }

  finish(event: Event): void {
    event.preventDefault();
    this.detailsForm.markAllAsTouched();
    if (this.detailsForm.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    const { fullName, phone, password } = this.detailsForm.getRawValue();
    this.auth.completeSignUp(this.setupToken, fullName.trim(), phone.trim(), password).subscribe({
      next: () => void this.router.navigateByUrl('/driver/profile'),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }
}