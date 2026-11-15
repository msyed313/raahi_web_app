import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/apis/api-error';
import { utc } from '../core/status';
import { Icon } from '../shared/icon';
import { AdminApiService } from './admin-api.service';
import { AdminDriverItem } from './admin-models';

const TABS: { value: string; label: string }[] = [
  { value: 'Pending', label: 'To review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Declined' },
  { value: 'Incomplete', label: 'Not submitted' },
  { value: '', label: 'All' },
];

export function driverStatusClass(status: string): string {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'Pending':
      return 'bg-saffron-100 text-saffron-700';
    case 'Rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-200 text-slate-600';
  }
}

export function driverStatusLabel(status: string): string {
  return status === 'Pending' ? 'To review' : status === 'Rejected' ? 'Declined' : status === 'Incomplete' ? 'Not submitted' : status;
}

@Component({
  selector: 'app-admin-drivers',
  imports: [RouterLink, DatePipe, Icon],
  template: `
    <div class="mb-3 flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold">Drivers</h1>
        <p class="text-xs text-slate-500">Review driver applications and manage drivers. Admin only.</p>
      </div>
      <button type="button" class="btn btn-outline btn-sm" (click)="load()" [disabled]="loading()">
        <app-icon name="refresh" size="h-3.5 w-3.5" /> Refresh
      </button>
    </div>

    <div class="mb-3 flex flex-wrap gap-1.5">
      @for (t of tabs; track t.value) {
        <button type="button" class="rounded-full px-3 py-1 text-xs font-semibold transition"
                [class]="tab() === t.value ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'"
                (click)="select(t.value)">{{ t.label }}</button>
      }
    </div>

    @if (error()) {
      <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{{ error() }}</div>
    }

    <div class="card !p-0">
      <div class="overflow-x-auto">
        <table class="table-compact">
          <thead>
            <tr><th>Driver</th><th>Vehicle</th><th>Status</th><th>Submitted</th><th></th></tr>
          </thead>
          <tbody>
            @for (d of items(); track d.driverId) {
              <tr>
                <td>
                  <span class="block font-semibold">{{ d.fullName }}</span>
                  <span class="block text-[11px] text-slate-500">{{ d.email || 'No account yet' }} &middot; {{ d.phone }}</span>
                </td>
                <td class="text-xs">{{ d.vehicleType || '—' }} <span class="text-slate-500">{{ d.plateNumber }}</span></td>
                <td>
                  <span class="badge" [class]="statusClass(d.approvalStatus)">{{ statusLabel(d.approvalStatus) }}</span>
                  @if (d.approvalStatus === 'Approved') {
                    <span class="ml-1 text-[11px] text-slate-500">{{ !d.isActive ? 'switched off' : d.isOnline ? 'online' : 'offline' }}</span>
                  }
                </td>
                <td class="text-xs">{{ d.submittedAtUtc ? (utcDate(d.submittedAtUtc) | date: 'd MMM y, h:mm a') : '—' }}</td>
                <td class="text-right">
                  <a [routerLink]="['/admin/drivers', d.driverId]" class="btn btn-outline btn-sm">{{ d.approvalStatus === 'Pending' ? 'Review' : 'Open' }}</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="py-6 text-center text-xs text-slate-500">{{ loading() ? 'Loading…' : 'No drivers here.' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DriversAdmin implements OnInit {
  private readonly api = inject(AdminApiService);

  readonly tabs = TABS;
  readonly tab = signal('Pending');
  readonly items = signal<AdminDriverItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusClass = driverStatusClass;
  readonly statusLabel = driverStatusLabel;

  ngOnInit(): void {
    this.load();
  }

  utcDate(value: string | null): string | null {
    return utc(value);
  }

  select(value: string): void {
    this.tab.set(value);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.driverList(this.tab() || undefined).subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}