import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Same rule as the API: 8+ characters with at least one letter and one number. */
export function passwordRule(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '');
  return v.length >= 8 && v.length <= 100 && /\p{L}/u.test(v) && /\d/.test(v) ? null : { weak: true };
}

/** Group validator: `password` (or `newPassword`) and `confirm` must match. */
export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value ?? group.get('newPassword')?.value;
  return password === group.get('confirm')?.value ? null : { mismatch: true };
}

/** Only follow same-site paths from ?returnUrl=, never an arbitrary URL. */
export function safeReturnUrl(raw: string | null, fallback: string): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/admin') ? raw : fallback;
}