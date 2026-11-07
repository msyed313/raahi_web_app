import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-account-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mb-4 flex gap-1 border-b border-slate-200" aria-label="Account">
      <a routerLink="/account/rides" routerLinkActive #rides="routerLinkActive"
         class="-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition"
         [class]="rides.isActive ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-900'">My rides</a>
      <a routerLink="/account/profile" routerLinkActive #profile="routerLinkActive"
         class="-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition"
         [class]="profile.isActive ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-900'">Profile</a>
               <a routerLink="/account/quotes" routerLinkActive #quotes="routerLinkActive"
         class="-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition"
         [class]="quotes.isActive ? 'border-navy-900 text-navy-900' : 'border-transparent text-slate-500 hover:text-navy-900'">Quotes</a>
    </nav>
  `,
})
export class AccountTabs {}