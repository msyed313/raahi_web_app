import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CustomerAuthService } from '../core/customer-auth.service';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <a routerLink="/" aria-label="Raahi home" class="flex items-center">
          <img src="raahi-logo.svg" alt="Raahi" class="h-8 w-auto" />
        </a>
        <nav class="flex items-center gap-1">
          <a routerLink="/" routerLinkActive="bg-slate-100 text-navy-900" [routerLinkActiveOptions]="{ exact: true }"
             class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 sm:block">Home</a>
          <a routerLink="/quote" routerLinkActive="bg-slate-100 text-navy-900"
             class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">Request Quote</a>

          @if (customer.session(); as s) {
            <a routerLink="/account/profile" routerLinkActive="bg-slate-100 text-navy-900" [attr.aria-label]="'My account, ' + s.fullName"
               class="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <app-icon name="user" size="h-4 w-4" />
              <span class="hidden max-w-[8rem] truncate sm:block">{{ s.fullName.split(' ')[0] }}</span>
            </a>
          } @else {
            <a routerLink="/account/login" routerLinkActive="bg-slate-100 text-navy-900" aria-label="Log in"
               class="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
              <app-icon name="user" size="h-4 w-4" />
              <span class="hidden sm:block">Log in</span>
            </a>
          }

          <a routerLink="/book" class="btn btn-accent btn-sm ml-1">Book a Ride</a>
        </nav>
      </div>
    </header>
  `,
})
export class Header {
  readonly customer = inject(CustomerAuthService);
}