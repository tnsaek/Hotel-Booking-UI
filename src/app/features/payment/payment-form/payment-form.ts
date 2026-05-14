import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../services/payment-service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service';
import { BookingService } from '../../../services/booking-service';

@Component({
  selector: 'app-payment-form',
  imports: [CommonModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss',
})
export class PaymentForm implements OnInit {

  bookingId! : number;
  bookingAmount: number | null = null;
  errorMessage = '';
  isLoading = false;
  isSubmitting = false;

  constructor(
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
    this.loadBookingAmount();
  }

  private loadBookingAmount(): void {
    if (!this.bookingId) {
      this.errorMessage = 'Invalid booking.';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const cachedBooking = this.bookingService
        .getCachedBookings(currentUser.id)
        .find((booking) => booking.bookingId === this.bookingId);

      if (cachedBooking) {
        this.bookingAmount = cachedBooking.totalAmount;
        this.isLoading = false;
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.bookingService.getBooking(this.bookingId).subscribe({
      next: (booking) => {
        this.bookingAmount = booking.totalAmount;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : 'Failed to load booking amount.');
        this.isLoading = false;
      }
    });
  }

  startCheckout() {
    if (this.bookingAmount === null || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const paymentRequest = {
      bookingId: this.bookingId,
      amount: this.bookingAmount
    };

    this.paymentService.processPayment(paymentRequest).subscribe({
      next: (response) => {
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        } else {
          this.errorMessage = 'Unable to start Stripe checkout.';
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : 'Failed to start Stripe checkout.');
        this.isSubmitting = false;
      },
    });
  }
}
