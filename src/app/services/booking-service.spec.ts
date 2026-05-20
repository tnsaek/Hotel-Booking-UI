import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { BookingRequest } from '../models/booking-request';
import { BookingResponse } from '../models/booking-response';
import { BookingUpdateRequest } from '../models/booking-update-request';
import { NotificationService } from './notification-service';
import { BookingService } from './booking-service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;
  let notificationServiceSpy: {
    requestNotificationsRefresh: ReturnType<typeof vi.fn>;
  };

  const bookingA: BookingResponse = {
    bookingId: 1,
    status: 'CONFIRMED',
    totalAmount: 100,
    checkIn: '2026-05-20',
    checkOut: '2026-05-21',
    roomId: 1,
    roomNumber: 101,
    roomType: 'SINGLE',
    hotelName: 'Hotel A',
  };

  const bookingB: BookingResponse = {
    ...bookingA,
    bookingId: 2,
    status: 'PENDING',
    totalAmount: 200,
  };

  beforeEach(() => {
    localStorage.clear();
    notificationServiceSpy = {
      requestNotificationsRefresh: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create booking and request notification refresh', () => {
    const requestBody: BookingRequest = {
      userId: 7,
      roomId: 3,
      checkIn: '2026-05-20',
      checkOut: '2026-05-21',
    };

    service.createBooking(requestBody).subscribe((response) => {
      expect(response).toEqual(bookingA);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/bookings`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush(bookingA);
    expect(notificationServiceSpy.requestNotificationsRefresh).toHaveBeenCalled();
  });

  it('should get booking and user bookings', () => {
    service.getBooking(1).subscribe((response) => expect(response).toEqual(bookingA));
    let request = httpMock.expectOne(`${environment.apiUrl}/bookings/1`);
    expect(request.request.method).toBe('GET');
    request.flush(bookingA);

    service.getUserBookings(7).subscribe((response) => expect(response).toEqual([bookingA]));
    request = httpMock.expectOne(`${environment.apiUrl}/bookings/user/7`);
    expect(request.request.method).toBe('GET');
    request.flush([bookingA]);
  });

  it('should update and cancel bookings with notification refresh', () => {
    const updateRequest: BookingUpdateRequest = {
      checkIn: '2026-05-22',
      checkOut: '2026-05-23',
    };

    service.updateBooking(1, updateRequest).subscribe((response) => expect(response).toEqual(bookingB));
    let request = httpMock.expectOne(`${environment.apiUrl}/bookings/1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(updateRequest);
    request.flush(bookingB);

    service.cancelBooking(1).subscribe((response) => expect(response).toBeNull());
    request = httpMock.expectOne(`${environment.apiUrl}/bookings/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(notificationServiceSpy.requestNotificationsRefresh).toHaveBeenCalledTimes(2);
  });

  it('should return empty cached bookings when cache is missing or user has no bookings', () => {
    expect(service.getCachedBookings(7)).toEqual([]);
    localStorage.setItem('cached_bookings', JSON.stringify({ 8: [bookingA] }));
    expect(service.getCachedBookings(7)).toEqual([]);
  });

  it('should recover from invalid cached booking JSON', () => {
    localStorage.setItem('cached_bookings', '{bad json');

    expect(service.getCachedBookings(7)).toEqual([]);
    expect(localStorage.getItem('cached_bookings')).toBeNull();
  });

  it('should cache, replace, update status, and update cached bookings', () => {
    service.cacheBooking(7, bookingA);
    service.cacheBooking(7, bookingB);
    expect(service.getCachedBookings(7)).toEqual([bookingB, bookingA]);

    service.replaceCachedBookings(7, [bookingA]);
    expect(service.getCachedBookings(7)).toEqual([bookingA]);

    service.updateCachedBookingStatus(7, 1, 'CANCELLED');
    expect(service.getCachedBookings(7)[0].status).toBe('CANCELLED');

    service.updateCachedBooking(7, { ...bookingA, totalAmount: 999 });
    expect(service.getCachedBookings(7)[0].totalAmount).toBe(999);
  });

  it('should merge bookings by id and sort descending', () => {
    const merged = service.mergeBookings(
      [bookingA, { ...bookingB, totalAmount: 111 }],
      [bookingB]
    );

    expect(merged).toEqual([bookingB, bookingA]);
  });

  it('should emit booking refresh requests', () => {
    const refreshSpy = vi.fn();
    const subscription = service.refreshBookings$.subscribe(refreshSpy);

    service.requestBookingsRefresh();

    expect(refreshSpy).toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
