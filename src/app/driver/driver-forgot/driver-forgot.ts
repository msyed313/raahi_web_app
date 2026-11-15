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
  selector: 'app-driver-forgot',
  styles: ``,
  templateUrl: './driver-forgot.html',
})
export class DriverForgot {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(DriverAuthService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2 | 3>(1);
  readonly email = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  private setupToken = '';

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    { password: ['', [Validators.required, passwordRule]], confirm: ['', Validators.required] },
    { validators: passwordsMatch },
  );

  emailInvalid(): boolean {
    const c = this.emailForm.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  weak(): boolean {
    const c = this.passwordForm.controls.password;
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    const c = this.passwordForm.controls.confirm;
    return this.passwordForm.hasError('mismatch') && (c.touched || c.dirty);
  }

  sendCode(event: Event): void {
    event.preventDefault();
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    const email = this.emailForm.controls.email.value.trim().toLowerCase();
    this.auth.requestOtp('ResetPassword', email).subscribe({
      next: () => {
        this.email.set(email);
        this.step.set(2);
        this.busy.set(false);
      },
      error: (err) => {
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
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    this.auth.completeReset(this.setupToken, this.passwordForm.controls.password.value).subscribe({
      next: () => void this.router.navigate(['/driver/login'], { queryParams: { reset: 1 } }),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }
}