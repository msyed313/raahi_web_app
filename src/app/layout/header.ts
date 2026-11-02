import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
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
          <a routerLink="/book" class="btn btn-accent btn-sm ml-1">Book a Ride</a>
        </nav>
      </div>
    </header>
  `,
})
export class Header {}
