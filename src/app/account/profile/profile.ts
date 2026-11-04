import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/api-error';
import { CustomerAuthService, CustomerProfile } from '../../core/customer-auth.service';
import { passwordRule, passwordsMatch } from '../../core/password';
import { Icon } from '../../shared/icon';
import { AccountTabs } from '../account-tabs';

const PHONE = /^\+?[0-9][0-9 \-]{6,19}$/;

@Component({
  imports: [ReactiveFormsModule, DatePipe, Icon, AccountTabs],
  selector: 'app-profile',
  styles: ``,
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(CustomerAuthService);

  readonly profile = signal<CustomerProfile | null>(null);
  readonly loadError = signal<string | null>(null);

  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly pwSaving = signal(false);
  readonly pwSaved = signal(false);
  readonly pwError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', [Validators.pattern(PHONE)]],
    defaultPickupAddress: ['', [Validators.maxLength(300)]],
  });

  readonly pwForm = this.fb.nonNullable.group(
    {
      currentPassword: [''],
      newPassword: ['', [Validators.required, passwordRule]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  ngOnInit(): void {
    this.auth.profile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form.reset({
          fullName: p.fullName,
          phone: p.phone ?? '',
          defaultPickupAddress: p.defaultPickupAddress ?? '',
        });
        if (p.hasPassword) this.pwForm.controls.currentPassword.addValidators(Validators.required);
      },
      error: (err) => this.loadError.set(apiErrorMessage(err)),
    });
  }

  bad(name: 'fullName' | 'phone'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  pwBad(name: 'currentPassword' | 'newPassword'): boolean {
    const c = this.pwForm.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  mismatch(): boolean {
    const c = this.pwForm.controls.confirm;
    return this.pwForm.hasError('mismatch') && (c.touched || c.dirty);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    this.saved.set(false);
    this.saveError.set(null);
    this.saving.set(true);
    const v = this.form.getRawValue();

    this.auth
      .updateProfile({
        fullName: v.fullName.trim(),
        phone: v.phone.trim() || null,
        defaultPickupAddress: v.defaultPickupAddress.trim() || null,
      })
      .subscribe({
        next: (p) => {
          this.profile.set(p);
          this.saved.set(true);
          this.saving.set(false);
          this.form.markAsPristine();
        },
        error: (err) => {
          this.saveError.set(apiErrorMessage(err));
          this.saving.set(false);
        },
      });
  }

  changePassword(): void {
    this.pwForm.markAllAsTouched();
    if (this.pwForm.invalid || this.pwSaving()) return;

    this.pwSaved.set(false);
    this.pwError.set(null);
    this.pwSaving.set(true);
    const v = this.pwForm.getRawValue();

    this.auth.changePassword(this.profile()?.hasPassword ? v.currentPassword : null, v.newPassword).subscribe({
      next: () => {
        this.profile.update((p) => (p ? { ...p, hasPassword: true } : p));
        this.pwForm.reset();
        this.pwForm.controls.currentPassword.addValidators(Validators.required);
        this.pwSaved.set(true);
        this.pwSaving.set(false);
      },
      error: (err) => {
        this.pwError.set(apiErrorMessage(err));
        this.pwSaving.set(false);
      },
    });
  }
}
