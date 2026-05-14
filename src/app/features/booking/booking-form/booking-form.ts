import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../services/booking-service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-booking-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.scss',
})
export class BookingForm implements OnInit {

  roomId!: number;
  form: any;
  errorMessage = '';
  dateConflictMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      checkIn: ['', [Validators.required, this.futureDateValidator]],
      checkOut: ['', [Validators.required]],
    }, { validators: this.dateRangeValidator });
  }

  ngOnInit(): void {
    this.roomId = Number(this.route.snapshot.paramMap.get('roomId'));
  }

  futureDateValidator(control: any): any {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today ? null : { pastDate: true };
  }

  dateRangeValidator(form: any): any {
    const checkIn = form.get('checkIn');
    const checkOut = form.get('checkOut');
    if (!checkIn?.value || !checkOut?.value) return null;
    const checkInDate = new Date(checkIn.value);
    const checkOutDate = new Date(checkOut.value);
    return checkOutDate > checkInDate ? null : { invalidRange: true };
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    this.dateConflictMessage = '';
    this.isSubmitting = true;
    this.form.disable();

    const request = {
      userId: currentUser.id,
      roomId: this.roomId,
      checkIn: this.form.value.checkIn!,
      checkOut: this.form.value.checkOut!,
    };

    this.bookingService.createBooking(request).subscribe({
      next: (response) => {
        this.bookingService.cacheBooking(currentUser.id, response);
        this.router.navigate(['/payment', response.bookingId]);
      },
      error: (error) => {
        if (error.status === 401 || error.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
          return;
        }
        const message =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : 'Booking failed. Please try again.');
        if (message.toLowerCase().includes('already booked')) {
          this.dateConflictMessage = message;
          this.errorMessage = '';
        } else {
          this.errorMessage = message;
        }
        this.isSubmitting = false;
        this.form.enable();
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
