import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Icon, IconName } from '../shared/icon';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <div class="min-h-screen md:flex">
      <!-- Sidebar (desktop) -->
      <aside class="hidden w-52 shrink-0 flex-col bg-navy-900 md:flex">
        <div class="flex h-14 items-center px-4">
          <img src="raahi-logo-dark.svg" alt="Raahi" class="h-7 w-auto" />
        </div>
        <nav class="flex-1 space-y-0.5 px-2 py-2">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-white/10 text-white"
               class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <app-icon [name]="item.icon" /> {{ item.label }}
            </a>
          }
        </nav>
        <div class="border-t border-white/10 p-3">
          <p class="truncate text-xs font-semibold text-white">{{ auth.session()?.fullName }}</p>
          <p class="text-[11px] text-slate-400">{{ auth.session()?.role }}</p>
          <button type="button" (click)="auth.logout()"
                  class="mt-2 flex h-8 w-full items-center gap-2 rounded-lg px-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            <app-icon name="log-out" /> Sign out
          </button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Top bar (mobile) -->
        <header class="sticky top-0 z-20 bg-navy-900 md:hidden">
          <div class="flex h-12 items-center justify-between px-4">
            <img src="raahi-logo-dark.svg" alt="Raahi" class="h-6 w-auto" />
            <button type="button" (click)="auth.logout()" class="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <app-icon name="log-out" /> Sign out
            </button>
          </div>
          <nav class="flex gap-1 overflow-x-auto px-3 pb-2">
            @for (item of nav; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="bg-white/15 text-white"
                 class="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-slate-300">
                <app-icon [name]="item.icon" size="h-3.5 w-3.5" /> {{ item.label }}
              </a>
            }
          </nav>
        </header>

        <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminShell {
  readonly auth = inject(AuthService);

  readonly nav: { path: string; label: string; icon: IconName }[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/bookings', label: 'Bookings', icon: 'clipboard' },
    { path: '/admin/quotes', label: 'Quotes', icon: 'message' },
  ];
}
