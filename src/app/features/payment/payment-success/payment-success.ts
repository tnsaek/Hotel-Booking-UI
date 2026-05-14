import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../../services/payment-service';
import { BookingService } from '../../../services/booking-service';

@Component({
  selector: 'app-payment-success',
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.scss',
})
export class PaymentSuccess implements OnInit {
  isConfirming = false;
  confirmationMessage = 'Confirming your payment...';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.confirmationMessage = 'Payment completed.';
      return;
    }

    this.isConfirming = true;
    this.paymentService.confirmStripeSession(sessionId).subscribe({
      next: () => {
        this.confirmationMessage = 'Your booking has been confirmed.';
        sessionStorage.setItem('refresh_bookings_after_payment', 'true');
        this.bookingService.requestBookingsRefresh();
        this.isConfirming = false;
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : 'Payment completed, but confirmation failed.');
        this.isConfirming = false;
      },
    });
  }
}
