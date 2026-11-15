import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/apis/api-error';
import { utc } from '../../core/status';
import { Icon } from '../../shared/icon';
import { SecureImage } from '../../shared/secure-image';
import { AdminApiService } from '../admin-api.service';
import { AdminDriverDetail } from '../admin-models';
import { driverStatusClass, driverStatusLabel } from '../drivers';
import { DriverDocType } from '../../core/drivermodels';

const DOCS: { type: DriverDocType; title: string }[] = [
  { type: 'LicenseFront', title: 'Licence (front)' },
  { type: 'LicenseBack', title: 'Licence (back)' },
  { type: 'VehiclePhoto', title: 'Vehicle photo' },
];

@Component({
  imports: [RouterLink, DatePipe, DecimalPipe, ReactiveFormsModule, Icon, SecureImage],
  selector: 'app-driver-detail',
  styles: ``,
  templateUrl: './driver-detail.html',
})
export class DriverDetailAdmin implements OnInit {
  protected readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  readonly docs = DOCS;
  readonly detail = signal<AdminDriverDetail | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly rejecting = signal(false);
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);

  readonly statusClass = driverStatusClass;
  readonly statusLabel = driverStatusLabel;

  readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
  });
  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
  });

  ngOnInit(): void {
    this.load();
  }

  utcDate(value: string | null): string | null {
    return utc(value);
  }

  expired(date: string | null): boolean {
    return !!date && date <= new Date().toISOString().slice(0, 10);
  }

  has(d: AdminDriverDetail, type: DriverDocType): boolean {
    return d.profile.documents.some((x) => x.docType === type);
  }

  load(): void {
    this.loading.set(true);
    this.api.driverDetail(this.id).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 404 ? 'We could not find this driver.' : apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private run(call: () => ReturnType<AdminApiService['approveDriver']>, done: string): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.flash.set(null);
    call().subscribe({
      next: () => {
        this.busy.set(false);
        this.rejecting.set(false);
        this.flash.set(done);
        this.load();
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.busy.set(false);
        this.load();
      },
    });
  }

  approve(): void {
    this.run(() => this.api.approveDriver(this.id), 'Driver approved. They were told by email.');
  }

  reject(event: Event): void {
    event.preventDefault();
    this.rejectForm.markAllAsTouched();
    if (this.rejectForm.invalid) return;
    this.run(() => this.api.rejectDriver(this.id, this.rejectForm.controls.reason.value.trim()), 'Application declined. The driver was told by email.');
  }

  setActive(active: boolean): void {
    this.run(() => this.api.setDriverActive(this.id, active), active ? 'Driver switched on.' : 'Driver switched off.');
  }

  invite(event: Event): void {
    event.preventDefault();
    this.inviteForm.markAllAsTouched();
    if (this.inviteForm.invalid) return;
    this.run(() => this.api.inviteDriver(this.id, this.inviteForm.controls.email.value.trim()), 'Invitation sent.');
  }
}