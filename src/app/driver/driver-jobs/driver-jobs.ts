import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/apis/api-error';
import { DriverApiService } from '../../core/auth/driver-api.service';
import { DriverAuthService } from '../../core/auth/driver-auth.service';
import { bookingStatusClass, statusLabel } from '../../core/status';
import { Icon } from '../../shared/icon';
import { DriverJob, DriverJobs, DriverProfile } from '../../core/drivermodels';

@Component({
  imports: [DatePipe, DecimalPipe, RouterLink, Icon],
  selector: 'app-driver-jobs',
  styles: ``,
  templateUrl: './driver-jobs.html',
})
export class DriverJobsPage implements OnInit {
  private readonly api = inject(DriverApiService);
  private readonly auth = inject(DriverAuthService);

  readonly jobs = signal<DriverJobs | null>(null);
  readonly profile = signal<DriverProfile | null>(null);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly declining = signal<number | null>(null);
  readonly reason = signal('');

  readonly statusClass = bookingStatusClass;
  readonly label = statusLabel;

  ngOnInit(): void {
    this.load();
  }

  /** Pickup times are local wall-clock times with no timezone, so the browser reads them as local. */
  pickup(j: DriverJob): Date {
    return new Date(j.pickupDateTime);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.profile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.auth.updateStatus(p.approvalStatus, p.fullName);
      },
      error: () => undefined,
    });
    this.api.jobs().subscribe({
      next: (j) => {
        this.jobs.set(j);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  startDecline(j: DriverJob): void {
    this.reason.set('');
    this.declining.set(j.bookingId);
  }

  act(j: DriverJob, action: 'accept' | 'start' | 'complete'): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api[action](j.bookingId).subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (err) => this.fail(err),
    });
  }

  decline(j: DriverJob): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.decline(j.bookingId, this.reason().trim() || null).subscribe({
      next: () => {
        this.busy.set(false);
        this.declining.set(null);
        this.load();
      },
      error: (err) => this.fail(err),
    });
  }

  private fail(err: unknown): void {
    this.error.set(apiErrorMessage(err));
    this.busy.set(false);
    this.declining.set(null);
    this.load(); // the admin may just have changed the job
  }
}