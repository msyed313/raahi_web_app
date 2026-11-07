import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../../core/apis/api-error';
import { CustomerAuthService, CustomerQuote } from '../../core/auth/customer-auth.service';
import { quoteStatusClass, utc } from '../../core/status';
import { Icon } from '../../shared/icon';
import { AccountTabs } from '../account-tabs';
@Component({
  imports: [RouterLink, DatePipe, DecimalPipe, Icon, AccountTabs],
  selector: 'app-my-quotes',
  styles: ``,
  templateUrl: './my-quotes.html',
})
export class MyQuotes implements OnInit {
  private readonly auth = inject(CustomerAuthService);

  readonly quotes = signal<CustomerQuote[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusClass = quoteStatusClass;

  ngOnInit(): void {
    this.load();
  }

  utcDate(value: string | null): string | null {
    return utc(value);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.quotes().subscribe({
      next: (list) => {
        this.quotes.set(list);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
