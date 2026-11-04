import { Component, ElementRef, OnInit, inject, output, signal, viewChild } from '@angular/core';
import { apiErrorMessage } from '../core/api-error';
import { CustomerAuthService } from '../core/customer-auth.service';

interface GoogleId {
  initialize(config: { client_id: string; callback: (r: { credential: string }) => void }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}

let gsiLoader: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  gsiLoader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gsiLoader = null;
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(s);
  });
  return gsiLoader;
}

@Component({
  selector: 'app-google-button',
  template: `
    <div [class.hidden]="!enabled()">
      <div class="my-3 flex items-center gap-3 text-[11px] uppercase tracking-wide text-slate-400">
        <span class="h-px flex-1 bg-slate-200"></span> or <span class="h-px flex-1 bg-slate-200"></span>
      </div>
      <div #host class="flex min-h-10 justify-center"></div>
      @if (error()) {
        <p class="mt-2 text-center text-xs text-red-600" role="alert">{{ error() }}</p>
      }
    </div>
  `,
})
export class GoogleButton implements OnInit {
  private readonly auth = inject(CustomerAuthService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  /** Fires after the customer is signed in. */
  readonly signedIn = output<void>();

  readonly enabled = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.providers().subscribe({
      next: (p) => {
        if (!p.googleEnabled || !p.googleClientId) return;
        loadGoogleScript()
          .then(() => this.render(p.googleClientId))
          .catch(() => this.enabled.set(false));
      },
      error: () => this.enabled.set(false),
    });
  }

  private render(clientId: string): void {
    const google = (window as unknown as { google?: { accounts: { id: GoogleId } } }).google;
    if (!google) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (r) => {
        this.error.set(null);
        this.auth.google(r.credential).subscribe({
          next: () => this.signedIn.emit(),
          error: (err) => this.error.set(apiErrorMessage(err)),
        });
      },
    });

    const el = this.host().nativeElement;
    google.accounts.id.renderButton(el, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(320, el.parentElement?.clientWidth || 320),
    });
    this.enabled.set(true);
  }
}