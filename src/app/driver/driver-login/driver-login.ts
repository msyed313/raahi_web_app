import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/apis/api-error';
import { DriverAuthService } from '../../core/auth/driver-auth.service';
import { Icon } from '../../shared/icon';

@Component({
  imports: [ReactiveFormsModule, RouterLink, Icon],
  selector: 'app-driver-login',
  styles: ``,
  templateUrl: './driver-login.html',
})
export class DriverLogin {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(DriverAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly resetDone = this.route.snapshot.queryParamMap.has('reset');
  readonly expired = this.route.snapshot.queryParamMap.has('expired');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.isValid()) void this.router.navigateByUrl('/driver');
  }

  invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(event: Event): void {
    event.preventDefault();
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.error.set(null);
    this.busy.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => void this.router.navigateByUrl('/driver'),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
