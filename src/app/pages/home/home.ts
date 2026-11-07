import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/apis/api.service';
import { duration } from '../../core/format';
import { RouteItem, VehicleType } from '../../core/models';
import { Icon } from '../../shared/icon';

@Component({
  imports: [RouterLink, DecimalPipe, Icon],
  selector: 'app-home',
  styles: ``,
  templateUrl: './home.html',
})
export class Home {

private readonly api = inject(ApiService);

  readonly currency = environment.currency;
  readonly routes = signal<RouteItem[]>([]);
  readonly vehicles = signal<VehicleType[]>([]);

  readonly steps = [
    { n: 1, title: 'Tell us about your trip', text: 'Pickup, drop-off, date and time, passengers and luggage.' },
    { n: 2, title: 'Pick a vehicle', text: 'See the price for each vehicle that fits your group.' },
    { n: 3, title: 'Confirm and pay', text: 'Pay online by card, or simply pay the driver.' },
  ];

  ngOnInit(): void {
    // The landing page should still look fine if the API is unreachable, so errors are ignored here.
    this.api.routes().subscribe({ next: (r) => this.routes.set(r), error: () => undefined });
    this.api.vehicleTypes().subscribe({ next: (v) => this.vehicles.set(v), error: () => undefined });
  }

  fromPrice(route: RouteItem): number | null {
    return route.prices.length ? Math.min(...route.prices.map((p) => p.price)) : null;
  }

  minutes(m: number): string {
    return duration(m);
  }

}
