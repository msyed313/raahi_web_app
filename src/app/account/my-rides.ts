import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/apis/api-error';
import { CustomerAuthService, CustomerRide } from '../core/auth/customer-auth.service';
import { RidePhase, isSoon, ridePhase, spanText } from '../core/ride-time';
import { bookingStatusClass, paymentLabel, paymentStatusClass, statusLabel } from '../core/status';
import { Icon } from '../shared/icon';
import { AccountTabs } from './account-tabs';
import { ApiService } from '../core/apis/api.service';

interface RideView extends CustomerRide {
  pickup: Date;
  phase: RidePhase;
  soon: boolean;
  note: string;
}

@Component({
  selector: 'app-my-rides',
  imports: [RouterLink, DatePipe, DecimalPipe, Icon, AccountTabs],
  template: `
    <div class="mx-auto w-full max-w-2xl px-4 py-6">
      <div class="mb-1 flex items-center justify-between">
        <h1 class="text-lg font-bold">My account</h1>
        <button type="button" class="btn btn-outline btn-sm" (click)="load()" [disabled]="loading()">
          <app-icon name="refresh" size="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      <app-account-tabs />

      @if (error()) {
        <div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{{ error() }}</div>
      }

      @if (loaded()) {
        <!-- Upcoming / Past switch -->
        <div class="mb-3 flex gap-1">
          @for (t of tabs(); track t.key) {
            <button type="button" (click)="tab.set(t.key)"
                    class="h-8 rounded-full px-3 text-xs font-semibold transition"
                    [class]="tab() === t.key ? 'bg-navy-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'">
              {{ t.label }} ({{ t.count }})
            </button>
          }
        </div>

        <div class="space-y-3">
          @for (r of visible(); track r.bookingId) {
            <article class="card !p-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-xs font-semibold text-navy-600">{{ r.bookingRef }}</p>
                  <p class="text-sm font-semibold">{{ r.pickup | date: 'EEE d MMM y, h:mm a' }}</p>
                </div>
                <span class="badge" [class]="statusClass(r.status)">{{ label(r.status) }}</span>
              </div>

              <!-- Where the ride is in time -->
              <p class="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold"
                 [class]="noteClass(r)">
                <app-icon [name]="noteIcon(r)" size="h-3.5 w-3.5" /> {{ r.note }}
              </p>

              <div class="mt-2.5 space-y-1 text-xs">
                <p class="flex items-start gap-1.5"><app-icon name="map-pin" size="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> <span>{{ r.pickupAddress }}</span></p>
                <p class="flex items-start gap-1.5"><app-icon name="map-pin" size="mt-0.5 h-3.5 w-3.5 text-red-500" /> <span>{{ r.dropoffAddress }}</span></p>
              </div>

              @if (r.driverName && r.phase !== 'cancelled') {
                <p class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                  <span class="flex items-center gap-1"><app-icon name="user" size="h-3.5 w-3.5" /> {{ r.driverName }}</span>
                  @if (r.driverPlate) { <span class="flex items-center gap-1"><app-icon name="car" size="h-3.5 w-3.5" /> {{ r.driverPlate }}</span> }
                  @if (r.driverPhone) { <a [href]="'tel:' + r.driverPhone" class="flex items-center gap-1 font-semibold text-navy-600"><app-icon name="phone" size="h-3.5 w-3.5" /> {{ r.driverPhone }}</a> }
                </p>
              }

              <div class="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <span class="text-slate-500">{{ r.vehicleType }} &middot; {{ r.passengers }} {{ r.passengers === 1 ? 'passenger' : 'passengers' }}</span>
                <span class="flex items-center gap-1.5">
                  <span class="badge" [class]="payClass(r.paymentStatus)">{{ payLabel(r.paymentStatus) }}</span>
                  <span class="font-semibold">{{ r.currency }} {{ r.totalAmount | number: '1.0-0' }}</span>
                </span>
              </div>
                @if (r.paymentMethod === 'Card' && r.status === 'Pending' && r.paymentStatus !== 'Paid') {
                <div class="mt-2 flex justify-end">
                  <button type="button" class="btn btn-accent btn-sm" (click)="payNow(r)" [disabled]="paying() === r.bookingId">
                    <app-icon name="credit-card" size="h-3.5 w-3.5" />
                    {{ paying() === r.bookingId ? 'Opening…' : 'Pay now' }}
                  </button>
                </div>
              }
            </article>
            
                           
          } @empty {
            <div class="card py-8 text-center">
              <app-icon name="car" size="mx-auto h-8 w-8 text-slate-300" />
              <p class="mt-2 text-sm font-semibold">
                {{ tab() === 'upcoming' ? 'No upcoming rides' : 'No past rides yet' }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">Your bookings will show up here.</p>
              <a routerLink="/book" class="btn btn-accent btn-sm mt-3">Book a Ride</a>
            </div>
          }
        </div>
      } @else if (loading()) {
        <p class="py-10 text-center text-xs text-slate-500">Loading your rides…</p>
      }
    </div>
  `,
})
export class MyRides implements OnInit {
  private readonly auth = inject(CustomerAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rides = signal<CustomerRide[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly tab = signal<'upcoming' | 'past'>('upcoming');

  /** Ticks every minute so the countdowns stay current. */
  private readonly now = signal(Date.now());

  readonly statusClass = bookingStatusClass;
  readonly payClass = paymentStatusClass;
  readonly payLabel = paymentLabel;
  readonly label = statusLabel;

  private readonly views = computed<RideView[]>(() => {
    const now = this.now();
    return this.rides().map((r) => {
      // Pickup times are local wall-clock times with no timezone, so the browser reads them as local
      const pickup = new Date(r.pickupDateTime);
      const phase = ridePhase(r.status, pickup, now);
      return { ...r, pickup, phase, soon: isSoon(pickup, now), note: this.noteFor(phase, pickup, now) };
    });
  });

  private readonly upcoming = computed(() =>
    this.views()
      .filter((r) => r.phase === 'upcoming' || r.phase === 'ongoing')
      // on going first, then the soonest pickup
      .sort((a, b) => (a.phase === b.phase ? a.pickup.getTime() - b.pickup.getTime() : a.phase === 'ongoing' ? -1 : 1)),
  );

  private readonly past = computed(() =>
    this.views()
      .filter((r) => r.phase !== 'upcoming' && r.phase !== 'ongoing')
      .sort((a, b) => b.pickup.getTime() - a.pickup.getTime()),
  );
     private readonly api = inject(ApiService);

  readonly paying = signal<number | null>(null);
  readonly visible = computed(() => (this.tab() === 'upcoming' ? this.upcoming() : this.past()));

  readonly tabs = computed(() => [
    { key: 'upcoming' as const, label: 'Upcoming', count: this.upcoming().length },
    { key: 'past' as const, label: 'Past', count: this.past().length },
  ]);

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.rides().subscribe({
      next: (list) => {
        this.rides.set(list);
        this.now.set(Date.now());
        // First load: if nothing is coming up but there is history, open the Past tab
        if (!this.loaded() && this.upcoming().length === 0 && this.past().length > 0) this.tab.set('past');
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  noteClass(r: RideView): string {
    switch (r.phase) {
      case 'ongoing':
        return 'bg-emerald-50 text-emerald-700';
      case 'upcoming':
        return r.soon ? 'bg-saffron-100 text-saffron-700' : 'bg-sky-50 text-sky-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  noteIcon(r: RideView): 'clock' | 'car' | 'check' | 'x' {
    switch (r.phase) {
      case 'ongoing':
        return 'car';
      case 'completed':
        return 'check';
      case 'cancelled':
        return 'x';
      default:
        return 'clock';
    }
  }

  private noteFor(phase: RidePhase, pickup: Date, now: number): string {
    const diff = pickup.getTime() - now;
    switch (phase) {
      case 'upcoming':
        return `Pickup in ${spanText(diff)}`;
      case 'ongoing':
        return 'On going: pickup time has started';
      case 'completed':
        return `Completed ${spanText(diff)} ago`;
      case 'cancelled':
        return 'This ride was cancelled';
      default:
        return `Pickup was ${spanText(diff)} ago`;
    }
  }
 payNow(r: RideView): void {
    const email = this.auth.session()?.email;
    if (!email) return;

    this.paying.set(r.bookingId);
    this.error.set(null);
    this.api.startCheckout(r.bookingRef, email).subscribe({
      next: (res) => window.location.assign(res.checkoutUrl),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.paying.set(null);
      },
    });
  }
}