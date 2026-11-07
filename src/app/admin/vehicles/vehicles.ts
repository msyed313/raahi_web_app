import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiErrorMessage } from '../../core/apis/api-error';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { CatalogVehicle } from '../admin-models';

@Component({
  imports: [ReactiveFormsModule, DecimalPipe, Icon],
  selector: 'app-vehicles',
  styles: ``,
  templateUrl: './vehicles.html',
})
export class Vehicles implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<CatalogVehicle[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);
  /** undefined = form closed, null = adding, number = editing that id */
  readonly editing = signal<number | null | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', [Validators.maxLength(300)]],
    maxPassengers: [4, [Validators.required, Validators.min(1), Validators.max(50)]],
    maxLuggage: [2, [Validators.required, Validators.min(0), Validators.max(50)]],
    imageUrl: ['', [Validators.maxLength(300)]],
    baseFare: [0, [Validators.required, Validators.min(0)]],
    perKmRate: [0, [Validators.required, Validators.min(0)]],
    minimumFare: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
    sortOrder: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.vehicles().subscribe({
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

  startNew(): void {
    this.form.reset({ maxPassengers: 4, maxLuggage: 2, baseFare: 0, perKmRate: 0, minimumFare: 0, isActive: true, sortOrder: this.items().length + 1 });
    this.editing.set(null);
    this.flash.set(null);
  }

  edit(v: CatalogVehicle): void {
    this.form.reset({ ...v, description: v.description ?? '', imageUrl: v.imageUrl ?? '' });
    this.editing.set(v.id);
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
    this.busy.set(true);
    this.error.set(null);
    this.api
      .saveVehicle(this.editing() ?? null, {
        ...v,
        name: v.name.trim(),
        description: v.description.trim() || null,
        imageUrl: v.imageUrl.trim() || null,
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
