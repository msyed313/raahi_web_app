import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer';
import { Header } from './layout/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <div class="flex min-h-screen flex-col">
      <app-header />
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class App {}
