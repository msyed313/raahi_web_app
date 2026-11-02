import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingConfirmation } from '../../core/models';
import { Icon } from '../../shared/icon';

@Component({
  imports: [DatePipe, DecimalPipe, RouterLink, Icon],
  selector: 'app-confirmation',
  styles: ``,
  templateUrl: './confirmation.html',
})
export class Confirmation {

 private readonly router = inject(Router);

  /** Flip to true when the payment gateway step is connected. */
  readonly paymentConnected = false;

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


}
