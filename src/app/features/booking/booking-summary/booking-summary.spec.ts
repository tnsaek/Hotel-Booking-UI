import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { BookingResponse } from '../../../models/booking-response';
import { AuthService } from '../../../services/auth-service';
import { BookingService } from '../../../services/booking-service';
import { BookingSummary } from './booking-summary';

describe('BookingSummary', () => {
  let component: BookingSummary;
  let fixture: ComponentFixture<BookingSummary>;
  let refreshBookings$: Subject<void>;
  let bookingServiceSpy: {
    refreshBookings$: Observable<void>;
    getCachedBookings: ReturnType<typeof vi.fn>;
    getUserBookings: ReturnType<typeof vi.fn>;
    replaceCachedBookings: ReturnType<typeof vi.fn>;
    updateCachedBooking: ReturnType<typeof vi.fn>;
    cancelBooking: ReturnType<typeof vi.fn>;
    updateBooking: ReturnType<typeof vi.fn>;
  };
  let authServiceSpy: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const booking: BookingResponse = {
    bookingId: 1,
    status: 'CONFIRMED',
    totalAmount: 200,
    checkIn: '2026-05-10',
    checkOut: '2026-05-12',
    roomId: 10,
    roomNumber: 101,
    roomType: 'DOUBLE',
    hotelName: 'Harbor Grand',
  };

  const futureBooking: BookingResponse = {
    ...booking,
    checkIn: dateDaysFromNow(5),
    checkOut: dateDaysFromNow(7),
  };

  beforeEach(async () => {
    sessionStorage.clear();
    refreshBookings$ = new Subject<void>();
    bookingServiceSpy = {
      refreshBookings$: refreshBookings$.asObservable(),
      getCachedBookings: vi.fn().mockReturnValue([]),
      getUserBookings: vi.fn().mockReturnValue(of([])),
      replaceCachedBookings: vi.fn(),
      updateCachedBooking: vi.fn(),
      cancelBooking: vi.fn().mockReturnValue(of(undefined)),
      updateBooking: vi.fn().mockReturnValue(of(booking)),
    };
    authServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      getCurrentUser: vi.fn().mockReturnValue({ id: 1 }),
      logout: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BookingSummary],
      providers: [
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingSummary);
    component = fixture.componentInstance;
  });

  function dateDaysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function buttonWithText(label: string): HTMLButtonElement | undefined {
    return buttons().find((button) => button.textContent?.includes(label));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load bookings on init and cache the server response', () => {
    bookingServiceSpy.getCachedBookings.mockReturnValue([booking]);
    bookingServiceSpy.getUserBookings.mockReturnValue(of([{ ...booking, bookingId: 2 }]));

    component.ngOnInit();

    expect(component.bookings).toEqual([{ ...booking, bookingId: 2 }]);
    expect(bookingServiceSpy.getCachedBookings).toHaveBeenCalledWith(1);
    expect(bookingServiceSpy.getUserBookings).toHaveBeenCalledWith(1);
    expect(bookingServiceSpy.replaceCachedBookings).toHaveBeenCalledWith(1, [{ ...booking, bookingId: 2 }]);
    expect(component.isLoading).toBe(false);
    expect(component.hasLoadedBookings).toBe(true);
  });

  it('should load cached bookings after returning from payment before refreshing', () => {
    sessionStorage.setItem('refresh_bookings_after_payment', 'true');
    bookingServiceSpy.getCachedBookings.mockReturnValue([booking]);
    bookingServiceSpy.getUserBookings.mockReturnValue(of([booking]));

    component.ngOnInit();

    expect(sessionStorage.getItem('refresh_bookings_after_payment')).toBeNull();
    expect(component.bookings).toEqual([booking]);
    expect(component.hasLoadedBookings).toBe(true);
  });

  it('should skip payment-return cached bookings when there is no current user', () => {
    sessionStorage.setItem('refresh_bookings_after_payment', 'true');
    authServiceSpy.getCurrentUser.mockReturnValueOnce(null).mockReturnValue({ id: 1 });
    bookingServiceSpy.getCachedBookings.mockReturnValue([booking]);
    bookingServiceSpy.getUserBookings.mockReturnValue(of([booking]));

    component.ngOnInit();

    expect(sessionStorage.getItem('refresh_bookings_after_payment')).toBeNull();
    expect(bookingServiceSpy.getCachedBookings).toHaveBeenCalledTimes(1);
    expect(component.bookings).toEqual([booking]);
  });

  it('should default a null server booking response to an empty list', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(of(null as unknown as BookingResponse[]));

    component.ngOnInit();

    expect(component.bookings).toEqual([]);
    expect(bookingServiceSpy.replaceCachedBookings).toHaveBeenCalledWith(1, []);
  });

  it('should reload bookings when refresh stream emits', () => {
    component.ngOnInit();
    bookingServiceSpy.getUserBookings.mockClear();

    refreshBookings$.next();

    expect(bookingServiceSpy.getUserBookings).toHaveBeenCalledWith(1);
  });

  it('should navigate to login when unauthenticated', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(false);

    component.ngOnInit();

    expect(component.bookings).toEqual([]);
    expect(component.hasLoadedBookings).toBe(true);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show a login message when no current user exists', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);

    component.ngOnInit();

    expect(component.bookings).toEqual([]);
    expect(component.errorMessage).toBe('Please log in to view your bookings.');
    expect(component.hasLoadedBookings).toBe(true);
  });

  it('should use cached bookings and custom message when loading fails', () => {
    bookingServiceSpy.getCachedBookings.mockReturnValue([booking]);
    bookingServiceSpy.getUserBookings.mockReturnValue(
      throwError(() => ({ error: { message: 'Load failed' } }))
    );

    component.ngOnInit();

    expect(component.bookings).toEqual([booking]);
    expect(component.errorMessage).toBe('Load failed');
    expect(component.isLoading).toBe(false);
  });

  it('should handle timeout loading errors', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(throwError(() => ({ name: 'TimeoutError' })));

    component.ngOnInit();

    expect(component.errorMessage).toBe('Loading bookings took too long. Showing saved bookings if available.');
  });

  it('should handle string and default loading errors', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(throwError(() => ({ error: 'String load fail' })));
    component.ngOnInit();
    expect(component.errorMessage).toBe('String load fail');

    fixture = TestBed.createComponent(BookingSummary);
    component = fixture.componentInstance;
    bookingServiceSpy.getUserBookings.mockReturnValue(throwError(() => ({})));
    component.ngOnInit();
    expect(component.errorMessage).toBe('Failed to load your bookings.');
  });

  it('should logout and navigate to login on unauthorized loading errors', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(throwError(() => ({ status: 401 })));

    component.ngOnInit();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.bookings).toEqual([]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should logout and navigate to login on forbidden loading errors', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(throwError(() => ({ status: 403 })));

    component.ngOnInit();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.bookings).toEqual([]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should optimistically cancel a booking and update cache', () => {
    const otherBooking = { ...booking, bookingId: 2 };
    component.bookings = [booking, otherBooking];
    bookingServiceSpy.cancelBooking.mockReturnValue(of(undefined));

    component.cancel(1);

    expect(component.bookings[0].status).toBe('CANCELLED');
    expect(component.bookings[1]).toEqual(otherBooking);
    expect(bookingServiceSpy.updateCachedBooking).toHaveBeenCalledWith(1, {
      ...booking,
      status: 'CANCELLED',
    });
    expect(bookingServiceSpy.cancelBooking).toHaveBeenCalledWith(1);
    expect(component.cancellingBookingIds.has(1)).toBe(false);
  });

  it('should cancel without cache updates when no current user exists', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    component.bookings = [booking];
    bookingServiceSpy.cancelBooking.mockReturnValue(of(undefined));

    component.cancel(1);

    expect(component.bookings[0].status).toBe('CANCELLED');
    expect(bookingServiceSpy.updateCachedBooking).not.toHaveBeenCalled();
  });

  it('should skip optimistic cache update when cancelled booking is not in the visible list', () => {
    component.bookings = [{ ...booking, bookingId: 2 }];
    bookingServiceSpy.cancelBooking.mockReturnValue(of(undefined));

    component.cancel(1);

    expect(bookingServiceSpy.updateCachedBooking).not.toHaveBeenCalled();
  });

  it('should ignore duplicate cancel requests while one is in progress', () => {
    component.cancellingBookingIds.add(1);

    component.cancel(1);

    expect(bookingServiceSpy.cancelBooking).not.toHaveBeenCalled();
  });

  it('should rollback cancel on error', () => {
    component.bookings = [booking];
    bookingServiceSpy.cancelBooking.mockReturnValue(
      throwError(() => ({ error: { message: 'Cancel failed' } }))
    );

    component.cancel(1);

    expect(component.bookings).toEqual([booking]);
    expect(bookingServiceSpy.replaceCachedBookings).toHaveBeenCalledWith(1, [booking]);
    expect(component.errorMessage).toBe('Cancel failed');
    expect(component.cancellingBookingIds.has(1)).toBe(false);
  });

  it('should rollback cancel errors without cache replacement when no current user exists', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    component.bookings = [booking];
    bookingServiceSpy.cancelBooking.mockReturnValue(throwError(() => ({})));

    component.cancel(1);

    expect(component.bookings).toEqual([booking]);
    expect(bookingServiceSpy.replaceCachedBookings).not.toHaveBeenCalled();
  });

  it('should handle string and default cancel errors', () => {
    component.bookings = [booking];
    bookingServiceSpy.cancelBooking.mockReturnValue(throwError(() => ({ error: 'String cancel fail' })));
    component.cancel(1);
    expect(component.errorMessage).toBe('String cancel fail');

    component.bookings = [booking];
    bookingServiceSpy.cancelBooking.mockReturnValue(throwError(() => ({})));
    component.cancel(1);
    expect(component.errorMessage).toBe('Failed to cancel booking.');
  });

  it('should start and cancel edit', () => {
    component.startEdit(booking);

    expect(component.editingBookingId).toBe(1);
    expect(component.editCheckIn).toBe('2026-05-10');
    expect(component.editCheckOut).toBe('2026-05-12');

    component.cancelEdit();

    expect(component.editingBookingId).toBeNull();
    expect(component.editCheckIn).toBe('');
    expect(component.editCheckOut).toBe('');
  });

  it('should save an edited booking, preserve displayed amount, cache it, and refresh silently', () => {
    const otherBooking = { ...booking, bookingId: 2 };
    component.bookings = [booking, otherBooking];
    component.startEdit(booking);
    component.editCheckIn = '2026-05-10';
    component.editCheckOut = '2026-05-13';
    const updated = { ...booking, checkIn: '2026-05-11', checkOut: '2026-05-13', totalAmount: 999 };
    bookingServiceSpy.updateBooking.mockReturnValue(of(updated));

    component.saveEdit(booking, '2026-05-10', '2026-05-13');

    expect(bookingServiceSpy.updateBooking).toHaveBeenCalledWith(1, {
      checkIn: '2026-05-10',
      checkOut: '2026-05-13',
    });
    expect(bookingServiceSpy.updateCachedBooking).toHaveBeenCalledWith(1, {
      ...updated,
      checkIn: '2026-05-10',
      checkOut: '2026-05-13',
      totalAmount: 300,
    });
    expect(component.editingBookingId).toBeNull();
    expect(component.savingBookingIds.has(1)).toBe(false);
  });

  it('should save without updating cache when no current user exists', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    component.bookings = [booking];
    component.startEdit(booking);
    component.editCheckIn = '2026-05-10';
    component.editCheckOut = '2026-05-13';
    bookingServiceSpy.updateBooking.mockReturnValue(of({ ...booking, checkOut: '2026-05-13' }));

    component.saveEdit(booking, '2026-05-10', '2026-05-13');

    expect(bookingServiceSpy.updateCachedBooking).not.toHaveBeenCalled();
    expect(component.editingBookingId).toBeNull();
  });

  it('should keep existing bookings and errors during a silent refresh failure after save', () => {
    component.bookings = [booking];
    component.startEdit(booking);
    component.editCheckIn = '2026-05-10';
    component.editCheckOut = '2026-05-13';
    bookingServiceSpy.updateBooking.mockReturnValue(of({ ...booking, checkOut: '2026-05-13' }));
    bookingServiceSpy.getUserBookings.mockReturnValue(throwError(() => ({ error: { message: 'Silent fail' } })));

    component.saveEdit(booking, '2026-05-10', '2026-05-13');

    expect(component.errorMessage).toBe('');
    expect(component.hasLoadedBookings).toBe(true);
  });

  it('should ignore duplicate save requests while one is in progress', () => {
    component.savingBookingIds.add(1);

    component.saveEdit(booking, '2026-05-10', '2026-05-13');

    expect(bookingServiceSpy.updateBooking).not.toHaveBeenCalled();
  });

  it('should redirect to checkout when updated booking requires payment', () => {
    const originalHref = window.location.href;
    const updated = {
      ...booking,
      paymentRequired: true,
      checkoutUrl: originalHref,
    };
    bookingServiceSpy.updateBooking.mockReturnValue(of(updated));

    component.saveEdit(booking, '2026-05-10', '2026-05-13');

    expect(window.location.href).toBe(originalHref);
    expect(bookingServiceSpy.updateCachedBooking).not.toHaveBeenCalled();
  });

  it('should handle update errors', () => {
    bookingServiceSpy.updateBooking.mockReturnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    component.saveEdit(booking, '2026-05-10', '2026-05-13');
    expect(component.errorMessage).toBe('Update failed');
    expect(component.savingBookingIds.has(1)).toBe(false);

    bookingServiceSpy.updateBooking.mockReturnValue(throwError(() => ({ name: 'TimeoutError' })));
    component.saveEdit(booking, '2026-05-10', '2026-05-13');
    expect(component.errorMessage).toBe('Booking update took too long. Please check Stripe/backend logs and try again.');

    bookingServiceSpy.updateBooking.mockReturnValue(throwError(() => ({ error: 'String update fail' })));
    component.saveEdit(booking, '2026-05-10', '2026-05-13');
    expect(component.errorMessage).toBe('String update fail');

    bookingServiceSpy.updateBooking.mockReturnValue(throwError(() => ({})));
    component.saveEdit(booking, '2026-05-10', '2026-05-13');
    expect(component.errorMessage).toBe('Failed to update booking.');
  });

  it('should determine whether a booking can be modified', () => {
    expect(component.canModifyBooking({ ...booking, status: 'CANCELLED' })).toBe(false);
    expect(component.canModifyBooking({ ...booking, checkIn: dateDaysFromNow(1) })).toBe(false);
    expect(component.canModifyBooking({ ...booking, checkIn: dateDaysFromNow(3) })).toBe(true);
  });

  it('should calculate displayed total amount', () => {
    component.editingBookingId = 1;
    component.editCheckIn = '2026-05-10';
    component.editCheckOut = '2026-05-13';

    expect(component.getDisplayedTotalAmount(booking)).toBe(300);
    expect(component.getDisplayedTotalAmount({ ...booking, bookingId: 2 })).toBe(200);
    expect(component.getDisplayedTotalAmount({ ...booking, checkIn: '2026-05-10', checkOut: '2026-05-10' })).toBe(200);
    expect(component.getDisplayedTotalAmount({ ...booking, checkIn: '2026-05-12', checkOut: '2026-05-10' })).toBe(200);
  });

  it('should render loading, error, and empty states', () => {
    const pendingBookings$ = new Subject<BookingResponse[]>();
    bookingServiceSpy.getUserBookings.mockReturnValue(pendingBookings$);

    fixture.detectChanges(false);
    expect(textContent()).toContain('Loading bookings...');

    fixture = TestBed.createComponent(BookingSummary);
    component = fixture.componentInstance;
    bookingServiceSpy.getUserBookings.mockReturnValue(of([]));
    fixture.detectChanges(false);
    expect(textContent()).toContain('There are no bookings made.');

    fixture = TestBed.createComponent(BookingSummary);
    component = fixture.componentInstance;
    bookingServiceSpy.getUserBookings.mockReturnValue(
      throwError(() => ({ error: { message: 'Render failed' } }))
    );
    fixture.detectChanges(false);
    expect(textContent()).toContain('Render failed');
  });

  it('should render booking details and action buttons for modifiable bookings', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(of([futureBooking]));

    fixture.detectChanges(false);

    const pageText = textContent();
    expect(pageText).toContain('Booking ID: 1');
    expect(pageText).toContain('Hotel: Harbor Grand');
    expect(pageText).toContain('Room: DOUBLE - #101');
    expect(pageText).toContain('Status: CONFIRMED');
    expect(pageText).toContain('Total Amount: $200');
    expect(pageText).toContain('Update Booking');
    expect(pageText).toContain('Cancel Booking');
  });

  it('should omit room number and modification buttons when booking cannot be modified', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(of([{ ...booking, roomNumber: 0, status: 'CANCELLED' }]));

    fixture.detectChanges(false);

    const pageText = textContent();
    expect(pageText).toContain('Room: DOUBLE');
    expect(pageText).not.toContain('#101');
    expect(pageText).not.toContain('Update Booking');
    expect(pageText).not.toContain('Cancel Booking');
  });

  it('should render edit mode and invoke save and cancel from template clicks', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(of([futureBooking]));
    component.editingBookingId = futureBooking.bookingId;
    component.editCheckIn = futureBooking.checkIn;
    component.editCheckOut = futureBooking.checkOut;
    const saveEditSpy = vi.spyOn(component, 'saveEdit');
    const cancelEditSpy = vi.spyOn(component, 'cancelEdit');

    fixture.detectChanges(false);

    const inputs = fixture.nativeElement.querySelectorAll('input');
    expect(inputs.length).toBe(2);
    inputs[0].value = futureBooking.checkIn;
    inputs[1].value = futureBooking.checkOut;
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].dispatchEvent(new Event('input'));
    expect(component.editCheckIn).toBe(futureBooking.checkIn);
    expect(component.editCheckOut).toBe(futureBooking.checkOut);
    expect(textContent()).toContain('Save');
    expect(textContent()).toContain('Cancel Edit');

    buttonWithText('Save')?.click();
    buttonWithText('Cancel Edit')?.click();

    expect(saveEditSpy).toHaveBeenCalledWith(futureBooking, futureBooking.checkIn, futureBooking.checkOut);
    expect(cancelEditSpy).toHaveBeenCalled();
  });

  it('should render saving and cancelling disabled states', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(of([futureBooking]));
    component.editingBookingId = futureBooking.bookingId;
    component.editCheckIn = futureBooking.checkIn;
    component.editCheckOut = futureBooking.checkOut;
    component.savingBookingIds.add(futureBooking.bookingId);

    fixture.detectChanges(false);

    expect(buttonWithText('Saving...')?.disabled).toBe(true);

    fixture = TestBed.createComponent(BookingSummary);
    component = fixture.componentInstance;
    bookingServiceSpy.getUserBookings.mockReturnValue(of([futureBooking]));
    component.editingBookingId = null;
    component.savingBookingIds.clear();
    component.cancellingBookingIds.add(futureBooking.bookingId);
    fixture.detectChanges(false);

    expect(buttonWithText('Cancelling...')?.disabled).toBe(true);
  });

  it('should invoke update and cancel actions from template buttons', () => {
    bookingServiceSpy.getUserBookings.mockReturnValue(of([futureBooking]));
    const startEditSpy = vi.spyOn(component, 'startEdit');
    const cancelSpy = vi.spyOn(component, 'cancel');

    fixture.detectChanges(false);

    buttonWithText('Update Booking')?.click();
    buttonWithText('Cancel Booking')?.click();

    expect(startEditSpy).toHaveBeenCalledWith(futureBooking);
    expect(cancelSpy).toHaveBeenCalledWith(futureBooking.bookingId);
  });

  it('should unsubscribe on destroy', () => {
    component.ngOnInit();

    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
