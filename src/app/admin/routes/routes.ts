import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { apiErrorMessage } from '../../core/apis/api-error';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { CatalogRoute, CatalogVehicle } from '../admin-models';

@Component({
  imports: [ReactiveFormsModule, DecimalPipe, Icon],
  selector: 'app-routes',
  styles: ``,
  templateUrl: './routes.html',
})
export class RoutesAdmin implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<CatalogRoute[]>([]);
  readonly vehicles = signal<CatalogVehicle[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);
  readonly editing = signal<number | null | undefined>(undefined);

  form = this.buildForm([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({ routes: this.api.catalogRoutes(), vehicles: this.api.vehicles() }).subscribe({
      next: ({ routes, vehicles }) => {
        this.items.set(routes);
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  vehicleName(id: number): string {
    return this.vehicles().find((v) => v.id === id)?.name ?? `#${id}`;
  }

  /** One price box per vehicle: the controls are named v<vehicleId>. */
  private buildForm(vehicles: CatalogVehicle[]) {
    const prices = Object.fromEntries(vehicles.map((v) => [`v${v.id}`, this.fb.control<number | null>(null, [Validators.min(0)])]));
    return this.fb.group({
      name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
      pickupLabel: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
      dropoffLabel: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
      distanceKm: this.fb.control<number | null>(null, [Validators.min(0)]),
      estimatedMinutes: this.fb.control<number | null>(null, [Validators.min(0)]),
      sortOrder: this.fb.nonNullable.control(0),
      isActive: this.fb.nonNullable.control(true),
      prices: this.fb.group(prices),
    });
  }

  startNew(): void {
    this.form = this.buildForm(this.vehicles());
    this.form.patchValue({ sortOrder: this.items().length + 1 });
    this.editing.set(null);
    this.flash.set(null);
  }

  edit(r: CatalogRoute): void {
    this.form = this.buildForm(this.vehicles());
    this.form.patchValue({
      name: r.name,
      pickupLabel: r.pickupLabel,
      dropoffLabel: r.dropoffLabel,
      distanceKm: r.distanceKm,
      estimatedMinutes: r.estimatedMinutes,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
    });
    for (const p of r.prices) this.form.controls.prices.get(`v${p.vehicleTypeId}`)?.setValue(p.price);
    this.editing.set(r.id);
    this.flash.set(null);
  }

  cancel(): void {
    this.editing.set(undefined);
  }

  save(event: Event): void {
    event.preventDefault();
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;

    const v = this.form.getRawValue();
    const prices = this.vehicles()
      .map((veh) => ({ vehicleTypeId: veh.id, price: (v.prices as Record<string, number | null>)[`v${veh.id}`] }))
      .filter((p): p is { vehicleTypeId: number; price: number } => p.price !== null && p.price !== undefined && `${p.price}` !== '');

    this.busy.set(true);
    this.error.set(null);
    this.api
      .saveRoute(this.editing() ?? null, {
        name: v.name.trim(),
        pickupLabel: v.pickupLabel.trim(),
        dropoffLabel: v.dropoffLabel.trim(),
        distanceKm: v.distanceKm || null,
        estimatedMinutes: v.estimatedMinutes || null,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
        prices,
      })
      .subscribe({
        next: (saved) => {
          this.busy.set(false);
          this.editing.set(undefined);
          this.flash.set(`${saved.name} saved.`);
          this.load();
        },
        error: (err) => {
          this.error.set(apiErrorMessage(err));
          this.busy.set(false);
        },
      });
  }
}
