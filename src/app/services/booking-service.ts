import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BookingRequest } from '../models/booking-request';
import { BookingResponse } from '../models/booking-response';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private api = 'http://localhost:8080/api/bookings';
  
  constructor(private http: HttpClient) {}

  createBooking(bookingRequest: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.api, bookingRequest);
  }

  getUserBookings(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`/api/bookings/${userId}`);
  }

  cancelBooking(bookingId: number): Observable<void> {
    return this.http.delete<void>(`/api/bookings/${bookingId}/cancel`, {});
  }
}
