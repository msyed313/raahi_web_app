import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

/**
 * Shows an image that sits behind a login. A plain <img src> cannot send the token,
 * so the file is fetched through HttpClient (the interceptor adds the token) and shown from a blob URL.
 */
@Component({
  selector: 'app-secure-image',
  template: `
    @if (src(); as s) {
      <img [src]="s" [alt]="alt()" class="h-full w-full" [class]="fit() === 'contain' ? 'object-contain' : 'object-cover'" />
    } @else {
      <span class="flex h-full w-full items-center justify-center text-[11px] text-slate-400">{{ failed() ? 'Could not load' : 'Loading…' }}</span>
    }
  `,
  host: { class: 'block overflow-hidden rounded-lg bg-slate-100' },
})
export class SecureImage {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  readonly url = input.required<string>();
  /** Change this number to reload the picture after a new upload. */
  readonly version = input(0);
  readonly alt = input('');
  /** 'contain' shows the whole picture (for reading a licence); 'cover' fills the box. */
  readonly fit = input<'cover' | 'contain'>('cover');

  readonly src = signal<SafeUrl | null>(null);
  readonly failed = signal(false);

  constructor() {
    effect((onCleanup) => {
      const url = this.url();
      this.version();
      this.src.set(null);
      this.failed.set(false);

      let objectUrl: string | null = null;
      const sub = this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          objectUrl = URL.createObjectURL(blob);
          this.src.set(this.sanitizer.bypassSecurityTrustUrl(objectUrl));
        },
        error: () => this.failed.set(true),
      });

      onCleanup(() => {
        sub.unsubscribe();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });
    });
  }
}