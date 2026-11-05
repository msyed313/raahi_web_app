import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject,signal} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingConfirmation } from '../../core/models';
import { Icon } from '../../shared/icon';
import { apiErrorMessage } from '../../core/api-error';
import { ApiService } from '../../core/api.service';


@Component({
  imports: [DatePipe, DecimalPipe, RouterLink, Icon],
  selector: 'app-confirmation',
  styles: ``,
  templateUrl: './confirmation.html',
})
export class Confirmation {

 private readonly router = inject(Router);

  /** Flip to true when the payment gateway step is connected. */
  // readonly paymentConnected = false;
    private readonly api = inject(ApiService);

  readonly paying = signal(false);
  readonly payError = signal<string | null>(null);

  // The booking is passed through router state (history.state) from the booking page.
  readonly booking: BookingConfirmation | null =
    (history.state?.['booking'] as BookingConfirmation | undefined) ?? null;

  constructor() {
    if (!this.booking) {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled':
      case 'NoShow':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-saffron-100 text-saffron-700';
    }
  }

  paymentClass(status: string): string {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'PayAtPickup':
        return 'bg-sky-100 text-sky-700';
      case 'Failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-saffron-100 text-saffron-700';
    }
  }

  paymentLabel(status: string): string {
    switch (status) {
      case 'PayAtPickup':
        return 'Pay the driver';
      case 'Unpaid':
        return 'Awaiting payment';
      default:
        return status;
    }
  }

    pay(): void {
    const b = this.booking;
    if (!b || this.paying()) return;

    this.payError.set(null);
    this.paying.set(true);
    this.api.startCheckout(b.bookingRef, b.email).subscribe({
      next: (r) => window.location.assign(r.checkoutUrl),
      error: (err) => {
        this.payError.set(apiErrorMessage(err));
        this.paying.set(false);
      },
    });
  }


}
