import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/api-error';
import { bookingStatusClass, statusLabel } from '../../core/status';
import { Icon, IconName } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { DashboardResponse } from '../admin-models';


interface StatCard {
  label: string;
  value: string;
  icon: IconName;
  tone: string;
  link: string;
  query?: Record<string, string>;
}



@Component({
  imports: [RouterLink, DatePipe, Icon],
  selector: 'app-dashboard',
  styles: ``,
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusClass = bookingStatusClass;
  readonly label = statusLabel;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.dashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  cards(d: DashboardResponse): StatCard[] {
    const s = d.summary;
    return [
      { label: "Today's pickups", value: String(s.todayPickups), icon: 'calendar', tone: 'bg-navy-50 text-navy-700', link: '/admin/bookings' },
      { label: 'Pending bookings', value: String(s.pendingBookings), icon: 'clock', tone: 'bg-saffron-100 text-saffron-700', link: '/admin/bookings', query: { status: 'Pending' } },
      { label: 'Need a driver', value: String(s.needsDriver), icon: 'car', tone: 'bg-violet-100 text-violet-700', link: '/admin/bookings', query: { status: 'Confirmed' } },
      { label: 'New quote requests', value: String(s.newQuotes), icon: 'calendar', tone: 'bg-sky-100 text-sky-700', link: '/admin/quotes', query: { status: 'New' } },
      { label: 'Cash to collect', value: `${s.currency} ${Math.round(s.cashToCollect).toLocaleString('en-US')}`, icon: 'banknote', tone: 'bg-emerald-100 text-emerald-700', link: '/admin/bookings' },
    ];
  }
}

