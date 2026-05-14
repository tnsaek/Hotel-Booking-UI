import { Component, OnDestroy, OnInit } from '@angular/core';
import { BookingResponse } from '../../../models/booking-response';
import { BookingService } from '../../../services/booking-service';
import { CommonModule} from '@angular/common';
import { AuthService } from '../../../services/auth-service';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription, timeout } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-summary',
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.scss',
})
export class BookingSummary implements OnInit, OnDestroy {

  bookings: BookingResponse[] = [];
  editingBookingId: number | null = null;
  editCheckIn = '';
  editCheckOut = '';
  errorMessage = '';
  isLoading = false;
  hasLoadedBookings = false;
  cancellingBookingIds = new Set<number>();
  savingBookingIds = new Set<number>();
  private refreshSubscription?: Subscription;
  private loadSubscription?: Subscription;

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshSubscription = this.bookingService.refreshBookings$.subscribe(() => {
      this.loadBookings();
    });

    const shouldRefreshAfterPayment = sessionStorage.getItem('refresh_bookings_after_payment') === 'true';
    if (shouldRefreshAfterPayment) {
      sessionStorage.removeItem('refresh_bookings_after_payment');
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.bookings = this.bookingService.getCachedBookings(currentUser.id);
        this.hasLoadedBookings = true;
      }
    }
    this.loadBookings();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
  }

  private loadBookings(silent = false): void {
    if (!this.authService.isAuthenticated()) {
      this.bookings = [];
      this.errorMessage = '';
      this.isLoading = false;
      this.hasLoadedBookings = true;
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.bookings = [];
      this.errorMessage = 'Please log in to view your bookings.';
      this.isLoading = false;
      this.hasLoadedBookings = true;
      return;
    }

    this.loadSubscription?.unsubscribe();
    this.loadSubscription = undefined;

    const cachedBookings = this.bookingService.getCachedBookings(currentUser.id);
    const hasCachedBookings = cachedBookings.length > 0;

    if (!silent && hasCachedBookings) {
      this.bookings = cachedBookings;
      this.hasLoadedBookings = true;
    }

    if (!silent) {
      this.isLoading = !hasCachedBookings;
      this.hasLoadedBookings = hasCachedBookings;
    }
    this.errorMessage = '';

    this.loadSubscription = this.bookingService.getUserBookings(currentUser.id)
      .pipe(
        timeout(15000),
        finalize(() => {
        this.isLoading = false;
        this.hasLoadedBookings = true;
      }))
      .subscribe({
      next: (response) => {
        // Treat the backend response as the source of truth. Cached bookings
        // are only a fallback when the server cannot be reached.
        this.bookings = response ?? [];
        this.bookingService.replaceCachedBookings(currentUser.id, this.bookings);
      },
      error: (error) => {
        if (error.status === 401 || error.status === 403) {
          this.authService.logout();
          this.bookings = [];
          this.errorMessage = '';
          this.router.navigate(['/login']);
          return;
        }
        if (!silent) {
          this.bookings = cachedBookings;
          this.errorMessage =
            error.error?.message ||
            (error.name === 'TimeoutError' ? 'Loading bookings took too long. Showing saved bookings if available.' : '') ||
            (typeof error.error === 'string' ? error.error : 'Failed to load your bookings.');
        }
      },
    });
  }

  cancel(bookingId: number): void{
    if (this.cancellingBookingIds.has(bookingId)) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const originalBookings = this.bookings;
    this.errorMessage = '';
    this.cancellingBookingIds.add(bookingId);

    this.bookings = this.bookings.map((booking) =>
      booking.bookingId === bookingId ? { ...booking, status: 'CANCELLED' } : booking
    );

    if (currentUser) {
      const updated = this.bookings.find((booking) => booking.bookingId === bookingId);
      if (updated) {
        this.bookingService.updateCachedBooking(currentUser.id, updated);
      }
    }

    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.cancellingBookingIds.delete(bookingId);
      },
      error: (error) => {
        this.cancellingBookingIds.delete(bookingId);
        this.bookings = originalBookings;
        if (currentUser) {
          this.bookingService.replaceCachedBookings(currentUser.id, originalBookings);
        }
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : 'Failed to cancel booking.');
      },
    });
  }

  startEdit(booking: BookingResponse): void {
    this.editingBookingId = booking.bookingId;
    this.editCheckIn = booking.checkIn;
    this.editCheckOut = booking.checkOut;
  }

  saveEdit(booking: BookingResponse, checkIn: string, checkOut: string): void {
    if (this.savingBookingIds.has(booking.bookingId)) {
      return;
    }

    this.errorMessage = '';
    this.savingBookingIds.add(booking.bookingId);

    this.bookingService.updateBooking(booking.bookingId, {
      checkIn,
      checkOut,
    }).pipe(
      timeout(20000),
      finalize(() => {
        this.savingBookingIds.delete(booking.bookingId);
      })
    ).subscribe({
      next: (updatedBooking) => {
        this.savingBookingIds.delete(booking.bookingId);

        if (updatedBooking.paymentRequired && updatedBooking.checkoutUrl) {
          window.location.href = updatedBooking.checkoutUrl;
          return;
        }

        const displayedTotalAmount = this.getDisplayedTotalAmount(booking);
        const visibleBooking = {
          ...updatedBooking,
          checkIn,
          checkOut,
          totalAmount: displayedTotalAmount,
        };

        this.bookings = this.bookings.map((existingBooking) =>
          existingBooking.bookingId === updatedBooking.bookingId ? visibleBooking : existingBooking
        );
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.bookingService.updateCachedBooking(currentUser.id, visibleBooking);
        }
        this.cancelEdit();
        this.loadBookings(true);
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (error.name === 'TimeoutError' ? 'Booking update took too long. Please check Stripe/backend logs and try again.' : '') ||
          (typeof error.error === 'string' ? error.error : 'Failed to update booking.');
      },
    });
  }

  cancelEdit(): void {
    this.editingBookingId = null;
    this.editCheckIn = '';
    this.editCheckOut = '';
  }

  canModifyBooking(booking: BookingResponse): boolean {
    if (booking.status === 'CANCELLED') {
      return false;
    }

    const checkInDate = new Date(`${booking.checkIn}T00:00:00`);
    const modificationDeadline = new Date(checkInDate.getTime() - (24 * 60 * 60 * 1000));
    return Date.now() < modificationDeadline.getTime();
  }

  getDisplayedTotalAmount(booking: BookingResponse): number {
    if (this.editingBookingId !== booking.bookingId || !this.editCheckIn || !this.editCheckOut) {
      return booking.totalAmount;
    }

    const currentNights = this.calculateNights(booking.checkIn, booking.checkOut);
    const editedNights = this.calculateNights(this.editCheckIn, this.editCheckOut);
    if (currentNights <= 0 || editedNights <= 0) {
      return booking.totalAmount;
    }

    const pricePerNight = booking.totalAmount / currentNights;
    return Math.round(pricePerNight * editedNights * 100) / 100;
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  }
}
