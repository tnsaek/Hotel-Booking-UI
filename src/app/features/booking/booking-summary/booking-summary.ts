import { Component, OnInit } from '@angular/core';
import { BookingResponse } from '../../../models/booking-response';
import { BookingService } from '../../../services/booking-service';

@Component({
  selector: 'app-booking-summary',
  imports: [],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.scss',
})
export class BookingSummary implements OnInit{

  bookings: BookingResponse[] = [];

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    const userId = 1; // Replace with actual user ID
    this.bookingService.getUserBookings(userId).subscribe(response => 
      this.bookings = response);
  }

  cancel(bookingId: number): void{
    this.bookingService.cancelBooking(bookingId).subscribe(() => {
      this.bookings = this.bookings.map(b => b.bookingId === bookingId ? { ...b, status: 'Cancelled' } : b) as BookingResponse[];
    });
  }
}
