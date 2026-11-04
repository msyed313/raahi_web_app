import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { CustomerAuthService } from '../../core/customer-auth.service';
import { safeReturnUrl } from '../../core/password';
import { Icon } from '../../shared/icon';
import { GoogleButton } from '../google-button';
@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon, GoogleButton],
  selector: 'app-login',
  styles: ``,
  templateUrl: './login.html',
})
export class Login {

private readonly fb = inject(FormBuilder);
  private readonly auth = inject(CustomerAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly resetDone = this.route.snapshot.queryParamMap.has('reset');
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  private readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  readonly returnQuery = this.returnUrl ? { returnUrl: this.returnUrl } : {};

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.isValid()) void this.router.navigateByUrl('/account/profile');
  }

  invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
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
