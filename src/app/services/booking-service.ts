import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BookingRequest } from '../models/booking-request';
import { BookingResponse } from '../models/booking-response';
import { BookingUpdateRequest } from '../models/booking-update-request';
import { environment } from '../../environments';
import { NotificationService } from './notification-service';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private api = `${environment.apiUrl}/bookings`;
  private cachedBookingsKey = 'cached_bookings';
  private refreshBookingsSubject = new Subject<void>();
  refreshBookings$ = this.refreshBookingsSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  createBooking(bookingRequest: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.api, bookingRequest).pipe(
      tap(() => this.notificationService.requestNotificationsRefresh())
    );
  }

  getBooking(bookingId: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${environment.apiUrl}/bookings/${bookingId}`);
  }

  getUserBookings(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${environment.apiUrl}/bookings/user/${userId}`);
  }

  updateBooking(bookingId: number, request: BookingUpdateRequest): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${environment.apiUrl}/bookings/${bookingId}`, request).pipe(
      tap(() => this.notificationService.requestNotificationsRefresh())
    );
  }

  cancelBooking(bookingId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/bookings/${bookingId}`).pipe(
      tap(() => this.notificationService.requestNotificationsRefresh())
    );
  }

  getCachedBookings(userId: number): BookingResponse[] {
    const cache = this.readCache();
    return cache[userId] ?? [];
  }

  cacheBooking(userId: number, booking: BookingResponse): void {
    const cache = this.readCache();
    const existing = cache[userId] ?? [];
    cache[userId] = this.mergeBookings(existing, [booking]);
    localStorage.setItem(this.cachedBookingsKey, JSON.stringify(cache));
  }

  replaceCachedBookings(userId: number, bookings: BookingResponse[]): void {
    const cache = this.readCache();
    cache[userId] = bookings;
    localStorage.setItem(this.cachedBookingsKey, JSON.stringify(cache));
  }

  updateCachedBookingStatus(userId: number, bookingId: number, status: string): void {
    const cache = this.readCache();
    const existing = cache[userId] ?? [];
    cache[userId] = existing.map((booking) =>
      booking.bookingId === bookingId ? { ...booking, status } : booking
    );
    localStorage.setItem(this.cachedBookingsKey, JSON.stringify(cache));
  }

  updateCachedBooking(userId: number, updatedBooking: BookingResponse): void {
    const cache = this.readCache();
    const existing = cache[userId] ?? [];
    cache[userId] = this.mergeBookings(existing, [updatedBooking]);
    localStorage.setItem(this.cachedBookingsKey, JSON.stringify(cache));
  }

  mergeBookings(primary: BookingResponse[], secondary: BookingResponse[]): BookingResponse[] {
    const merged = new Map<number, BookingResponse>();

    [...primary, ...secondary].forEach((booking) => {
      merged.set(booking.bookingId, booking);
    });

    return Array.from(merged.values()).sort((a, b) => b.bookingId - a.bookingId);
  }

  requestBookingsRefresh(): void {
    this.refreshBookingsSubject.next();
  }

  private readCache(): Record<number, BookingResponse[]> {
    const raw = localStorage.getItem(this.cachedBookingsKey);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Record<number, BookingResponse[]>;
    } catch {
      localStorage.removeItem(this.cachedBookingsKey);
      return {};
    }
  }
}
