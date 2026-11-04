import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import {
  bookingStatusClass,
  paymentLabel,
  paymentStatusClass,
  statusLabel,
  utc,
} from '../../core/status';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { AdminBookingDetailResponse, Driver } from '../admin-models';

interface ActionDef {
  status: string;
  label: string;
  tone: 'primary' | 'plain' | 'danger';
}

@Component({
  imports: [RouterLink, DatePipe, DecimalPipe, Icon],
  selector: 'app-booking-detail',
  styles: ``,
  templateUrl: './booking-detail.html',
})
export class BookingDetail implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly data = signal<AdminBookingDetailResponse | null>(null);
  readonly drivers = signal<Driver[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);

  readonly driverId = signal<number | null>(null);
  readonly pending = signal<string | null>(null);
  readonly note = signal('');

  readonly statusClass = bookingStatusClass;
  readonly payClass = paymentStatusClass;
  readonly payLabel = paymentLabel;
  readonly label = statusLabel;
  readonly utcDate = utc;

  readonly canAssign = computed(() => {
    const s = this.data()?.booking.status;
    return s === 'Confirmed' || s === 'Assigned';
  });

  readonly actions = computed<ActionDef[]>(() => {
    switch (this.data()?.booking.status) {
      case 'Pending':
        return [{ status: 'Cancelled', label: 'Cancel booking', tone: 'danger' }];
      case 'Confirmed':
        return [
          { status: 'NoShow', label: 'Mark no-show', tone: 'plain' },
          { status: 'Cancelled', label: 'Cancel booking', tone: 'danger' },
        ];
      case 'Assigned':
        return [
          { status: 'Completed', label: 'Mark completed', tone: 'primary' },
          { status: 'Confirmed', label: 'Unassign driver', tone: 'plain' },
          { status: 'NoShow', label: 'Mark no-show', tone: 'plain' },
          { status: 'Cancelled', label: 'Cancel booking', tone: 'danger' },
        ];
      default:
        return []; // Completed, Cancelled, NoShow are final
    }
  });

  ngOnInit(): void {
    this.load();
    this.api.drivers().subscribe({ next: (d) => this.drivers.set(d), error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.api.booking(this.id).subscribe({
      next: (d) => {
        this.data.set(d);
        this.driverId.set(d.booking.driverId);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.status === 404 ? 'Booking not found.' : apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  assign(): void {
    const driverId = this.driverId();
    if (!driverId) return;
    this.send('Assigned', 'Driver assigned.', { driverId });
  }

  startAction(status: string): void {
    this.flash.set(null);
    this.error.set(null);
    this.note.set('');
    this.pending.set(status);
  }

  cancelPending(): void {
    this.pending.set(null);
    this.note.set('');
  }

  confirmText(status: string): string {
    switch (status) {
      case 'Cancelled':
        return 'Cancel this booking?';
      case 'Completed':
        return 'Mark this ride as completed?';
      case 'NoShow':
        return 'Mark the customer as a no-show?';
      case 'Confirmed':
        return 'Remove the driver and return to Confirmed?';
      default:
        return 'Change status?';
    }
  }

  confirmPending(): void {
    const status = this.pending();
    if (!status) return;
    this.send(status, `Booking updated: ${statusLabel(status)}.`, {});
  }

  private send(newStatus: string, success: string, extra: { driverId?: number }): void {
    this.busy.set(true);
    this.flash.set(null);
    this.error.set(null);
    this.api
      .updateBookingStatus(this.id, { newStatus, note: this.note().trim() || null, ...extra })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.pending.set(null);
          this.note.set('');
          this.flash.set(success);
          this.load();
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(apiErrorMessage(err));
        },
      });
  }
}

