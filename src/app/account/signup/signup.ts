import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { CustomerAuthService } from '../../core/customer-auth.service';
import { passwordRule, passwordsMatch, safeReturnUrl } from '../../core/password';
import { Icon } from '../../shared/icon';
import { GoogleButton } from '../google-button';
import { OtpStep } from '../otp-step/otp-step';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon, OtpStep, GoogleButton],
  selector: 'app-signup',
  styles: ``,
  templateUrl: './signup.html',
})
export class Signup {

   private readonly fb = inject(FormBuilder);
  private readonly auth = inject(CustomerAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<1 | 2 | 3>(1);
  readonly email = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly exists = signal(false);

  private setupToken = '';
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  readonly returnQuery = this.returnUrl ? { returnUrl: this.returnUrl } : {};

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
  });

  readonly detailsForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      password: ['', [Validators.required, passwordRule]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    if (this.auth.isValid()) void this.router.navigateByUrl('/account/profile');
  }

  emailInvalid(): boolean {
    const c = this.emailForm.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  bad(name: 'fullName' | 'password'): boolean {
    const c = this.detailsForm.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    const c = this.detailsForm.controls.confirm;
    return this.detailsForm.hasError('mismatch') && (c.touched || c.dirty);
  }

  sendCode(): void {
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

  back(): void {
    this.error.set(null);
    this.step.set(1);
  }

  finish(): void {
    this.detailsForm.markAllAsTouched();
    if (this.detailsForm.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    const { fullName, password } = this.detailsForm.getRawValue();

    this.auth.completeSignUp(this.setupToken, fullName.trim(), password).subscribe({
      next: () => this.done(),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }

  done(): void {
    void this.router.navigateByUrl(safeReturnUrl(this.returnUrl, '/account/profile'));
  }



}
