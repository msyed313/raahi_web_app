import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/apis/api-error';
import { ApiService } from '../../core/apis/api.service';
import { PaymentStatus } from '../../core/models';
import { Icon } from '../../shared/icon';

const POLL_MS = 2000;
const MAX_POLLS = 10;

@Component({
  imports: [RouterLink, DecimalPipe, Icon],
  selector: 'app-payment-result',
  styles: ``,
  templateUrl: './payment-result.html',
})
export class PaymentResult implements OnInit {
  private readonly api = inject(ApiService);
  private readonly txn = inject(ActivatedRoute).snapshot.queryParamMap.get('txn') ?? '';

  readonly info = signal<PaymentStatus | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly retrying = signal(false);
  readonly waiting = signal(true);

  private polls = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  ngOnInit(): void {
    if (!this.txn) {
      this.loadError.set('The payment reference is missing.');
      return;
    }
    this.poll();
  }

  private poll(): void {
    this.api.paymentStatus(this.txn).subscribe({
      next: (p) => {
        this.info.set(p);
        if (p.attemptStatus === 'Initiated') {
          if (++this.polls < MAX_POLLS) this.timer = setTimeout(() => this.poll(), POLL_MS);
          else this.waiting.set(false);
        }
      },
      error: (err) => this.loadError.set(apiErrorMessage(err)),
    });
  }

  retry(): void {
    if (this.retrying()) return;
    this.error.set(null);
    this.retrying.set(true);
    this.api.retryPayment(this.txn).subscribe({
      next: (r) => window.location.assign(r.checkoutUrl),
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.retrying.set(false);
      },
    });
  }
}
