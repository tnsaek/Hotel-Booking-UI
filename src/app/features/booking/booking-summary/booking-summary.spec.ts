import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingSummary } from './booking-summary';

describe('BookingSummary', () => {
  let component: BookingSummary;
  let fixture: ComponentFixture<BookingSummary>;
  let bookingServiceSpy: any;
  let authServiceSpy: any;
  let routerSpy: any;
  let refreshBookings$: any;

  beforeEach(async () => {
    refreshBookings$ = { subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) };
    bookingServiceSpy = {
      refreshBookings$,
      getCachedBookings: jest.fn(() => []),
      getUserBookings: jest.fn(() => ({ pipe: () => ({ subscribe: jest.fn() }) })),
      replaceCachedBookings: jest.fn(),
      updateCachedBooking: jest.fn(),
      cancelBooking: jest.fn(() => ({ subscribe: jest.fn() })),
      updateBooking: jest.fn(() => ({ pipe: () => ({ subscribe: jest.fn() }) })),
    };
    authServiceSpy = {
      isAuthenticated: jest.fn(() => true),
      getCurrentUser: jest.fn(() => ({ id: 1 })),
      logout: jest.fn(),
    };
    routerSpy = { navigate: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [BookingSummary],
      providers: [
        { provide: 'BookingService', useValue: bookingServiceSpy },
        { provide: 'AuthService', useValue: authServiceSpy },
        { provide: 'Router', useValue: routerSpy },
      ],
    }).overrideComponent(BookingSummary, {
      set: {
        providers: [
          { provide: 'BookingService', useValue: bookingServiceSpy },
          { provide: 'AuthService', useValue: authServiceSpy },
          { provide: 'Router', useValue: routerSpy },
        ],
      },
    }).compileComponents();
    fixture = TestBed.createComponent(BookingSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should unsubscribe on destroy', () => {
    component.refreshSubscription = { unsubscribe: jest.fn() };
    component.loadSubscription = { unsubscribe: jest.fn() };
    component.ngOnDestroy();
    expect(component.refreshSubscription.unsubscribe).toHaveBeenCalled();
    expect(component.loadSubscription.unsubscribe).toHaveBeenCalled();
  });

  it('should start edit', () => {
    const booking = { bookingId: 1, checkIn: '2026-05-10', checkOut: '2026-05-12' };
    component.startEdit(booking as any);
    expect(component.editingBookingId).toBe(1);
    expect(component.editCheckIn).toBe('2026-05-10');
    expect(component.editCheckOut).toBe('2026-05-12');
  });

  it('should cancel edit', () => {
    component.editingBookingId = 1;
    component.editCheckIn = '2026-05-10';
    component.editCheckOut = '2026-05-12';
    component.cancelEdit();
    expect(component.editingBookingId).toBeNull();
    expect(component.editCheckIn).toBe('');
    expect(component.editCheckOut).toBe('');
  });

  it('should not allow modification if cancelled', () => {
    const booking = { status: 'CANCELLED', checkIn: '2026-05-10' };
    expect(component.canModifyBooking(booking as any)).toBe(false);
  });

  it('should not allow modification if check-in is within 24h', () => {
    const checkIn = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0];
    const booking = { status: 'CONFIRMED', checkIn };
    expect(component.canModifyBooking(booking as any)).toBe(false);
  });

  it('should allow modification if check-in is more than 24h away', () => {
    const checkIn = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
    const booking = { status: 'CONFIRMED', checkIn };
    expect(component.canModifyBooking(booking as any)).toBe(true);
  });

  it('should calculate displayed total amount', () => {
    const booking = { bookingId: 1, checkIn: '2026-05-10', checkOut: '2026-05-12', totalAmount: 200 };
    component.editingBookingId = 1;
    component.editCheckIn = '2026-05-10';
    component.editCheckOut = '2026-05-13';
    expect(component.getDisplayedTotalAmount(booking as any)).toBe(300);
  });

  it('should return booking total amount if not editing', () => {
    const booking = { bookingId: 1, checkIn: '2026-05-10', checkOut: '2026-05-12', totalAmount: 200 };
    component.editingBookingId = 2;
    expect(component.getDisplayedTotalAmount(booking as any)).toBe(200);
  });

  it('should calculate nights correctly', () => {
    expect((component as any).calculateNights('2026-05-10', '2026-05-12')).toBe(2);
    expect((component as any).calculateNights('2026-05-10', '2026-05-10')).toBe(0);
  });
});
