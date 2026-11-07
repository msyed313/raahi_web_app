import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ApiService } from '../core/apis/api.service';
import { PlaceSuggestion } from '../core/models';

/**
 * Text box with address suggestions. It still works as a plain text box when the
 * address service is unavailable, so a booking is never blocked by it.
 */
@Component({
  selector: 'app-address-input',
  imports: [ReactiveFormsModule],
  template: `
    <div class="relative">
      <input [id]="inputId()" class="input" [formControl]="control()" autocomplete="off" [placeholder]="placeholder()"
             [class.invalid]="invalid()" role="combobox" [attr.aria-expanded]="open()"
             (input)="onType()" (focus)="open.set(suggestions().length > 0)" (blur)="closeSoon()" />

      @if (open()) {
        <ul class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg" role="listbox">
          @for (s of suggestions(); track s.address + s.lat) {
            <li role="option">
              <button type="button" class="block w-full px-3 py-2 text-left hover:bg-slate-50" (mousedown)="pick(s)">{{ s.address }}</button>
            </li>
          }
          <li class="px-3 py-1 text-[10px] text-slate-400">Powered by Geoapify &middot; &copy; OpenStreetMap contributors</li>
        </ul>
      }
    </div>
  `,
})
export class AddressInput {
  private readonly api = inject(ApiService);

  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly placeholder = input('');
  readonly invalid = input(false);

  /** A suggestion was chosen: coordinates are known. */
  readonly picked = output<PlaceSuggestion>();
  /** The text was edited by hand: any earlier coordinates are no longer valid. */
  readonly cleared = output<void>();

  readonly suggestions = signal<PlaceSuggestion[]>([]);
  readonly open = signal(false);

  private readonly typed$ = new Subject<string>();

  constructor() {
    this.typed$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((q) => (q.trim().length < 3 ? of([]) : this.api.searchPlaces(q.trim()).pipe(catchError(() => of([]))))),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((list) => {
        this.suggestions.set(list);
        this.open.set(list.length > 0);
      });
  }

  onType(): void {
    this.cleared.emit();
    this.typed$.next(this.control().value);
  }

  pick(s: PlaceSuggestion): void {
    this.control().setValue(s.address);
    this.suggestions.set([]);
    this.open.set(false);
    this.picked.emit(s);
  }

  closeSoon(): void {
    // lets a click on a suggestion register before the list disappears
    setTimeout(() => this.open.set(false), 150);
  }
}