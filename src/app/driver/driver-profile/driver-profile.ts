import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { apiErrorMessage } from '../../core/apis/api-error';
import { ApiService } from '../../core/apis/api.service';
import { DriverDocType, DriverProfile } from '../../core/drivermodels';
import { DriverAuthService } from '../../core/auth/driver-auth.service';
import { VehicleType } from '../../core/models';
import { Icon } from '../../shared/icon';
import { compressImage } from '../../shared/image-compress';
import { SecureImage } from '../../shared/secure-image';
import { DriverApiService } from '../../core/auth/driver-api.service';
const DOCS: { type: DriverDocType; title: string; hint: string }[] = [
  { type: 'LicenseFront', title: 'Licence (front)', hint: 'Clear photo, all text readable' },
  { type: 'LicenseBack', title: 'Licence (back)', hint: 'Back side of your driving licence' },
  { type: 'VehiclePhoto', title: 'Vehicle photo', hint: 'Whole vehicle, number plate visible' },
];
@Component({
  imports: [ReactiveFormsModule, DecimalPipe, Icon, SecureImage],
  selector: 'app-driver-profile',
  styles: ``,
  templateUrl: './driver-profile.html',
})
export class DriverProfilePage implements OnInit {
  protected readonly api = inject(DriverApiService);
  private readonly publicApi = inject(ApiService);
  private readonly auth = inject(DriverAuthService);
  private readonly fb = inject(FormBuilder);

  readonly docs = DOCS;
  readonly today = new Date().toISOString().slice(0, 10);

  readonly profile = signal<DriverProfile | null>(null);
  readonly vehicleTypes = signal<VehicleType[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly uploading = signal<DriverDocType | null>(null);
  readonly versions = signal<Partial<Record<DriverDocType, number>>>({});
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);

  readonly form = this.fb.group({
    fullName: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    phone: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\+?[0-9][0-9 \-]{6,19}$/)]),
    cnicNumber: this.fb.nonNullable.control('', [Validators.pattern(/^(\d{5}-?\d{7}-?\d)?$/)]),
    licenseNumber: this.fb.nonNullable.control('', [Validators.maxLength(30)]),
    licenseExpiry: this.fb.nonNullable.control(''),
    vehicleTypeId: this.fb.control<number | null>(null),
    plateNumber: this.fb.nonNullable.control('', [Validators.maxLength(20)]),
    vehicleModel: this.fb.nonNullable.control('', [Validators.maxLength(60)]),
    vehicleYear: this.fb.control<number | null>(null, [Validators.min(1990), Validators.max(new Date().getFullYear() + 1)]),
    vehicleColor: this.fb.nonNullable.control('', [Validators.maxLength(30)]),
  });

  ngOnInit(): void {
    this.publicApi.vehicleTypes(1, 0).subscribe({ next: (v) => this.vehicleTypes.set(v), error: () => undefined });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.profile().subscribe({
      next: (p) => {
        this.apply(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

 private apply(p: DriverProfile): void {
    this.profile.set(p);
    this.auth.updateStatus(p.approvalStatus, p.fullName);
    this.form.reset({
      fullName: p.fullName,
      phone: p.phone,
      cnicNumber: p.cnicNumber ?? '',
      licenseNumber: p.licenseNumber ?? '',
      licenseExpiry: p.licenseExpiry ?? '',
      vehicleTypeId: p.vehicleTypeId,
      plateNumber: p.plateNumber ?? '',
      vehicleModel: p.vehicleModel ?? '',
      vehicleYear: p.vehicleYear,
      vehicleColor: p.vehicleColor ?? '',
    });

    // Under review: everything is locked. Approved: only the phone number can change.
    if (p.canEdit) {
      this.form.enable({ emitEvent: false });
    } else {
      this.form.disable({ emitEvent: false });
      if (p.approvalStatus === 'Approved') this.form.controls.phone.enable({ emitEvent: false });
    }
  }

  has(p: DriverProfile, type: DriverDocType): boolean {
    return p.documents.some((d) => d.docType === type);
  }

  bad(name: 'fullName' | 'phone' | 'cnicNumber' | 'licenseNumber' | 'licenseExpiry' | 'vehicleYear'): boolean {
    const c = this.form.controls[name];
    if (name === 'licenseExpiry' && c.value && c.value <= this.today) return true;
    return c.invalid && (c.touched || c.dirty);
  }

  private body() {
    const v = this.form.getRawValue();
    return {
      fullName: v.fullName.trim(),
      phone: v.phone.trim(),
      cnicNumber: v.cnicNumber.trim() || null,
      licenseNumber: v.licenseNumber.trim() || null,
      licenseExpiry: v.licenseExpiry || null,
      vehicleTypeId: v.vehicleTypeId,
      plateNumber: v.plateNumber.trim().toUpperCase() || null,
      vehicleModel: v.vehicleModel.trim() || null,
      vehicleYear: v.vehicleYear || null,
      vehicleColor: v.vehicleColor.trim() || null,
    };
  }

  save(event: Event): void {
    event.preventDefault();
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.begin();
    this.api.updateProfile(this.body()).subscribe({
      next: (p) => {
        this.apply(p);
        this.busy.set(false);
        this.flash.set('Saved.');
      },
      error: (err) => this.fail(err),
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    this.begin();
    this.api
      .updateProfile(this.body())
      .pipe(switchMap(() => this.api.submit()))
      .subscribe({
        next: (p) => {
          this.apply(p);
          this.busy.set(false);
          this.flash.set('Your application was submitted. We will email you the result.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (err) => {
          this.fail(err);
          this.load();
        },
      });
  }

  toggleOnline(online: boolean): void {
    this.begin();
    this.api.setOnline(online).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.busy.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  async upload(type: DriverDocType, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.error.set(null);
    this.flash.set(null);
    this.uploading.set(type);
    try {
      const small = await compressImage(file);
      this.api.uploadDoc(type, small).subscribe({
        next: () => {
          this.versions.update((v) => ({ ...v, [type]: (v[type] ?? 0) + 1 }));
          this.uploading.set(null);
          this.api.profile().subscribe({ next: (p) => this.apply(p), error: () => undefined });
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.uploading.set(null);
        },
      });
    } catch {
      this.error.set('We could not read that photo. Please choose a JPG or PNG picture.');
      this.uploading.set(null);
    }
  }

  private begin(): void {
    this.busy.set(true);
    this.error.set(null);
    this.flash.set(null);
  }

  private fail(err: unknown): void {
    this.error.set(apiErrorMessage(err));
    this.busy.set(false);
  }
}