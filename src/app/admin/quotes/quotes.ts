import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { QUOTE_STATUSES, quoteStatusClass, utc } from '../../core/status';
import { Icon } from '../../shared/icon';
import { AdminApiService } from '../admin-api.service';
import { AdminQuoteItem, Paged } from '../admin-models';

const PAGE_SIZE = 15;

@Component({
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, Icon],
  selector: 'app-quotes',
  styles: ``,
  templateUrl: './quotes.html',
})
export class Quotes implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);

  readonly statusTabs = [{ value: '', label: 'All' }, ...QUOTE_STATUSES.map((s) => ({ value: s as string, label: s }))];

  readonly filters = this.fb.nonNullable.group({ status: [''], search: [''] });

  readonly priceForm = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    validityHours: this.fb.control<number | null>(48),
    note: this.fb.nonNullable.control(''),
  });

  readonly result = signal<Paged<AdminQuoteItem> | null>(null);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly flash = signal<string | null>(null);
  readonly openId = signal<number | null>(null);

  readonly items = computed(() => this.result()?.items ?? []);
  readonly totalRows = computed(() => this.result()?.totalRows ?? 0);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalRows() / PAGE_SIZE)));
  readonly rangeText = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '0 requests';
    const from = (this.page() - 1) * PAGE_SIZE + 1;
    return `${from}-${Math.min(from + PAGE_SIZE - 1, total)} of ${total}`;
  });

  readonly statusClass = quoteStatusClass;
  readonly utcDate = utc;

  private requestId = 0;

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.openId.set(null);
      this.load();
    });
  }

  ngOnInit(): void {
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status && QUOTE_STATUSES.includes(status as never)) {
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
    this.openId.set(null);
    this.load();
  }

  toggle(q: AdminQuoteItem): void {
    if (this.openId() === q.quoteId) {
      this.openId.set(null);
      return;
    }
    this.flash.set(null);
    this.error.set(null);
    this.priceForm.reset({ amount: q.quotedAmount, validityHours: 48, note: q.adminNote ?? '' });
    this.openId.set(q.quoteId);
  }

  load(): void {
    const f = this.filters.getRawValue();
    const id = ++this.requestId;
    this.loading.set(true);
    this.api
      .quotes({ status: f.status || undefined, search: f.search.trim() || undefined, page: this.page(), pageSize: PAGE_SIZE })
      .subscribe({
        next: (r) => {
          if (id !== this.requestId) return;
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

  send(q: AdminQuoteItem): void {
    this.priceForm.markAllAsTouched();
    if (this.priceForm.invalid || this.busy()) return;

    const v = this.priceForm.getRawValue();
    this.busy.set(true);
    this.error.set(null);
    this.api
      .respondToQuote(q.quoteId, {
        quotedAmount: Number(v.amount),
        adminNote: v.note.trim() || null,
        validityHours: v.validityHours ? Number(v.validityHours) : null,
      })
      .subscribe({
        next: () => this.done(`${q.quoteRef}: price saved.`),
        error: (err) => this.fail(err),
      });
  }

  decline(q: AdminQuoteItem): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.declineQuote(q.quoteId, this.priceForm.getRawValue().note.trim() || null).subscribe({
      next: () => this.done(`${q.quoteRef}: request declined.`),
      error: (err) => this.fail(err),
    });
  }

  private done(message: string): void {
    this.busy.set(false);
    this.openId.set(null);
    this.flash.set(message);
    this.load();
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(apiErrorMessage(err));
  }
}
