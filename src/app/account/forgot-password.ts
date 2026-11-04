import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { CustomerAuthService } from '../core/customer-auth.service';
import { passwordRule, passwordsMatch } from '../core/password';
import { Icon } from '../shared/icon';
import { OtpStep } from './otp-step/otp-step';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Icon, OtpStep],
  template: `
    <div class="mx-auto w-full max-w-sm px-4 py-8">
      <div class="card !p-5">
        <h1 class="text-base font-bold">Reset your password</h1>
        <p class="mt-0.5 text-xs text-slate-500">
          @switch (step()) {
            @case (1) { We will email you a 6-digit code. }
            @case (2) { Verify your email. }
            @case (3) { Choose a new password. }
          }
        </p>

        @if (error()) {
          <div class="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
            <app-icon name="alert" class="mt-0.5" /> <span>{{ error() }}</span>
          </div>
        }

        @switch (step()) {
          @case (1) {
            <form [formGroup]="emailForm" (ngSubmit)="sendCode()" novalidate class="mt-3">
              <label class="label" for="email">Email</label>
              <input id="email" type="email" class="input" formControlName="email" autocomplete="email"
                     placeholder="you@example.com" [class.invalid]="emailInvalid()" />
              @if (emailInvalid()) { <p class="field-error">Enter a valid email address</p> }
              <button type="submit" class="btn btn-accent mt-3 w-full" [disabled]="busy()">
                @if (busy()) { Sending… } @else { Send code }
              </button>
            </form>
          }

          @case (2) {
            <div class="mt-3">
              <app-otp-step [email]="email()" purpose="ResetPassword" (verified)="onVerified($event)" (changeEmail)="step.set(1)" />
            </div>
          }

          @case (3) {
            <form [formGroup]="passwordForm" (ngSubmit)="finish()" novalidate class="mt-3 space-y-3">
              <div>
                <label class="label" for="password">New password</label>
                <input id="password" type="password" class="input" formControlName="password"
                       autocomplete="new-password" [class.invalid]="weak()" />
                <p class="mt-1 text-[11px] text-slate-500" [class.text-red-600]="weak()">
                  At least 8 characters, with a letter and a number.
                </p>
              </div>
              <div>
                <label class="label" for="confirm">Confirm password</label>
                <input id="confirm" type="password" class="input" formControlName="confirm"
                       autocomplete="new-password" [class.invalid]="mismatch()" />
                @if (mismatch()) { <p class="field-error">Passwords do not match</p> }
              </div>
              <button type="submit" class="btn btn-accent w-full" [disabled]="busy()">
                @if (busy()) { Saving… } @else { Save new password }
              </button>
            </form>
          }
        }
      </div>

      <p class="mt-4 text-center text-xs text-slate-500">
        <a routerLink="/account/login" class="font-semibold text-navy-600 hover:underline">&larr; Back to log in</a>
      </p>
    </div>
  `,
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(CustomerAuthService);
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
    {
      password: ['', [Validators.required, passwordRule]],
      confirm: ['', Validators.required],
    },
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

  sendCode(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    const email = this.emailForm.controls.email.value.trim().toLowerCase();

    // The API answers the same way whether or not the account exists
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

  finish(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    this.auth.completeReset(this.setupToken, this.passwordForm.controls.password.value).subscribe({
      next: () => void this.router.navigate(['/account/login'], { queryParams: { reset: 1 } }),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }
}