import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row">
        <img src="raahi-logo.svg" alt="Raahi" class="h-6 w-auto opacity-80" />
        <nav class="flex items-center gap-4">
          <a routerLink="/book" class="hover:text-navy-900">Book a Ride</a>
          <a routerLink="/quote" class="hover:text-navy-900">Request Quote</a>
        </nav>
        <p>&copy; {{ year }} Raahi. All rights reserved.</p>
      </div>
    </footer>
  `,
})
export class Footer {
  readonly year = new Date().getFullYear();
}
