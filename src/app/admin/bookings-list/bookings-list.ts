import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import {
  BOOKING_STATUSES,
  bookingStatusClass,
  paymentLabel,
  paymentStatusClass,
  statusLabel,
} from '../../core/status';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { AdminBookingItem, Paged } from '../admin-models';

const PAGE_SIZE = 15;


@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DecimalPipe, Icon],
  selector: 'app-bookings-list',
  styles: ``,
  templateUrl: './bookings-list.html',
})
export class BookingsList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly statusTabs = [
    { value: '', label: 'All' },
    ...BOOKING_STATUSES.map((s) => ({ value: s as string, label: statusLabel(s) })),
  ];

  readonly filters = this.fb.nonNullable.group({
    status: [''],
    search: [''],
    fromDate: [''],
    toDate: [''],
  });

  readonly result = signal<Paged<AdminBookingItem> | null>(null);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly items = computed(() => this.result()?.items ?? []);
  readonly totalRows = computed(() => this.result()?.totalRows ?? 0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalRows() / PAGE_SIZE)));
  readonly rangeText = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0 bookings';
    const from = (this.page() - 1) * PAGE_SIZE + 1;
    return `${from}-${Math.min(from + PAGE_SIZE - 1, total)} of ${total}`;
  });

  readonly statusClass = bookingStatusClass;
  readonly payClass = paymentStatusClass;
  readonly payLabel = paymentLabel;
  readonly label = statusLabel;

  private requestId = 0;

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  ngOnInit(): void {
    // Dashboard cards link here with ?status=Pending
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status && BOOKING_STATUSES.includes(status as never)) {
      this.filters.controls.status.setValue(status, { emitEvent: false });
    }
    this.load();
  }

  setStatus(value: string): void {
    this.filters.controls.status.setValue(value);
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }

  open(b: AdminBookingItem): void {
    // Row click opens the detail page (the link inside the row does the same for keyboard users)
    void this.router.navigate(['/admin/bookings', b.bookingId]);
  }

  load(): void {
    const f = this.filters.getRawValue();
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    this.api
      .bookings({
        status: f.status || undefined,
        search: f.search.trim() || undefined,
        fromDate: f.fromDate || undefined,
        toDate: f.toDate || undefined,
        page: this.page(),
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (r) => {
          if (id !== this.requestId) return; // a newer request is already in flight
          this.result.set(r);
          this.loading.set(false);
        },
        error: (err) => {
          if (id !== this.requestId) return;
          this.error.set(apiErrorMessage(err));
          this.loading.set(false);
        },
      });
  }
}

