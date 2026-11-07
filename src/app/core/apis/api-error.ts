import { HttpErrorResponse } from '@angular/common/http';

/** Turns an API error (ProblemDetails / validation problem) into one readable sentence. */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. Please check your connection and try again.';
    }
    if (err.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      const messages = (Object.values(body.errors) as string[][]).flat();
      if (messages.length) return messages.join(' ');
    }
    if (typeof body?.detail === 'string') return body.detail;
    if (typeof body?.title === 'string') return body.title;
  }
  return 'Something went wrong. Please try again.';
}
