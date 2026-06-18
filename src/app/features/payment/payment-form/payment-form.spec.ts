import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { BookingResponse } from '../../../models/booking-response';
import { AuthService } from '../../../services/auth-service';
import { BookingService } from '../../../services/booking-service';
import { PaymentService } from '../../../services/payment-service';
import { PaymentForm } from './payment-form';

describe('PaymentForm', () => {
  let component: PaymentForm;
  let fixture: ComponentFixture<PaymentForm>;
  let paymentServiceSpy: {
    processPayment: ReturnType<typeof vi.fn>;
  };
  let bookingServiceSpy: {
    getCachedBookings: ReturnType<typeof vi.fn>;
    getBooking: ReturnType<typeof vi.fn>;
  };
  let authServiceSpy: {
    getCurrentUser: ReturnType<typeof vi.fn>;
  };
  let routeBookingId: string | null;

  const booking: BookingResponse = {
    bookingId: 42,
    status: 'PENDING',
    totalAmount: 275,
    checkIn: '2026-05-20',
    checkOut: '2026-05-22',
    roomId: 8,
    roomNumber: 502,
    roomType: 'SUITE',
    hotelName: 'Harbor Grand',
  };

  beforeEach(async () => {
    routeBookingId = '42';
    paymentServiceSpy = {
      processPayment: vi.fn(),
    };
    bookingServiceSpy = {
      getCachedBookings: vi.fn().mockReturnValue([]),
      getBooking: vi.fn().mockReturnValue(of(booking)),
    };
    authServiceSpy = {
      getCurrentUser: vi.fn().mockReturnValue({ id: 5 }),
    };

    await TestBed.configureTestingModule({
      imports: [PaymentForm],
      providers: [
        { provide: PaymentService, useValue: paymentServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => routeBookingId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentForm);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function amountInput(): HTMLInputElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#amount')!;
  }

  function paymentButton(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-payment')!;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load amount from cached bookings on init', () => {
    bookingServiceSpy.getCachedBookings.mockReturnValue([booking]);

    fixture.detectChanges();

    expect(component.bookingId).toBe(42);
    expect(authServiceSpy.getCurrentUser).toHaveBeenCalled();
    expect(bookingServiceSpy.getCachedBookings).toHaveBeenCalledWith(5);
    expect(bookingServiceSpy.getBooking).not.toHaveBeenCalled();
    expect(component.bookingAmount).toBe(275);
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(amountInput().value).toBe('275');
    expect(paymentButton().disabled).toBe(false);
  });

  it('should load amount from backend when cache is unavailable', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    bookingServiceSpy.getBooking.mockReturnValue(of(booking));

    fixture.detectChanges();

    expect(bookingServiceSpy.getCachedBookings).not.toHaveBeenCalled();
    expect(bookingServiceSpy.getBooking).toHaveBeenCalledWith(42);
    expect(component.bookingAmount).toBe(275);
    expect(component.isLoading).toBe(false);
  });

  it('should show an invalid booking error when route id is missing', () => {
    routeBookingId = null;

    fixture.detectChanges();

    expect(component.bookingId).toBe(0);
    expect(component.errorMessage).toBe('Invalid booking.');
    expect(bookingServiceSpy.getBooking).not.toHaveBeenCalled();
    expect(textContent()).toContain('Invalid booking.');
  });

  it('should handle backend amount load errors from an error object', () => {
    bookingServiceSpy.getBooking.mockReturnValue(
      throwError(() => ({ error: { message: 'Amount unavailable' } }))
    );

    fixture.detectChanges();

    expect(component.errorMessage).toBe('Amount unavailable');
    expect(component.bookingAmount).toBeNull();
    expect(component.isLoading).toBe(false);
    expect(textContent()).toContain('Amount unavailable');
  });

  it('should handle backend amount load string and default errors', () => {
    bookingServiceSpy.getBooking.mockReturnValue(throwError(() => ({ error: 'String load fail' })));
    fixture.detectChanges();
    expect(component.errorMessage).toBe('String load fail');

    fixture = TestBed.createComponent(PaymentForm);
    component = fixture.componentInstance;
    bookingServiceSpy.getBooking.mockReturnValue(throwError(() => ({})));
    fixture.detectChanges();
    expect(component.errorMessage).toBe('Failed to load booking amount.');
  });

  it('should render the empty amount form with a disabled button before amount is loaded', () => {
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    bookingServiceSpy.getBooking.mockReturnValue(of({ ...booking, totalAmount: null as unknown as number }));

    fixture.detectChanges();

    expect(component.bookingAmount).toBeNull();
    expect(amountInput().value).toBe('');
    expect(paymentButton().disabled).toBe(true);
  });

  it('should start checkout from the template payment button', () => {
    paymentServiceSpy.processPayment.mockReturnValue(of({
      status: 'FAILED',
      transactionId: 'txn_123',
      checkoutUrl: '',
    }));
    bookingServiceSpy.getCachedBookings.mockReturnValue([booking]);

    fixture.detectChanges();

    paymentButton().click();
    fixture.detectChanges();

    expect(paymentServiceSpy.processPayment).toHaveBeenCalledWith({
      bookingId: 42,
      amount: 275,
    });
    expect(textContent()).toContain('Unable to start Stripe checkout.');
  });

  it('should render the submitting button state', () => {
    component.bookingAmount = 275;
    component.isLoading = false;
    component.isSubmitting = true;

    fixture.detectChanges();

    expect(paymentButton().disabled).toBe(true);
    expect(paymentButton().textContent).toContain('Opening Stripe...');
  });

  it('should render the loading state without the payment form', () => {
    const booking$ = new Subject<BookingResponse>();
    authServiceSpy.getCurrentUser.mockReturnValue(null);
    bookingServiceSpy.getBooking.mockReturnValue(booking$);

    fixture.detectChanges();

    expect(textContent()).toContain('Loading payment details...');
    expect((fixture.nativeElement as HTMLElement).querySelector('.payment-form')).toBeNull();
    booking$.next(booking);
    booking$.complete();
  });

  it('should not start checkout without an amount or while already submitting', () => {
    component.bookingId = 42;
    component.bookingAmount = null;

    component.startCheckout();

    expect(paymentServiceSpy.processPayment).not.toHaveBeenCalled();

    component.bookingAmount = 275;
    component.isSubmitting = true;
    component.startCheckout();

    expect(paymentServiceSpy.processPayment).not.toHaveBeenCalled();
  });

  it('should start Stripe checkout when a checkout URL is returned', () => {
    const checkoutUrl = window.location.href;
    paymentServiceSpy.processPayment.mockReturnValue(of({
      status: 'PENDING',
      transactionId: 'txn_123',
      checkoutUrl,
    }));
    component.bookingId = 42;
    component.bookingAmount = 275;
    component.errorMessage = 'Previous error';

    component.startCheckout();

    expect(paymentServiceSpy.processPayment).toHaveBeenCalledWith({
      bookingId: 42,
      amount: 275,
    });
    expect(component.errorMessage).toBe('');
    expect(component.isSubmitting).toBe(true);
    expect(window.location.href).toBe(checkoutUrl);
  });

  it('should show an error when Stripe checkout URL is missing', () => {
    paymentServiceSpy.processPayment.mockReturnValue(of({
      status: 'FAILED',
      transactionId: 'txn_123',
      checkoutUrl: '',
    }));
    component.bookingId = 42;
    component.bookingAmount = 275;

    component.startCheckout();

    expect(component.errorMessage).toBe('Unable to start Stripe checkout.');
    expect(component.isSubmitting).toBe(false);
  });

  it('should handle payment errors from object, string, and default responses', () => {
    component.bookingId = 42;
    component.bookingAmount = 275;
    paymentServiceSpy.processPayment.mockReturnValue(
      throwError(() => ({ error: { message: 'Payment rejected' } }))
    );
    component.startCheckout();
    expect(component.errorMessage).toBe('Payment rejected');
    expect(component.isSubmitting).toBe(false);

    paymentServiceSpy.processPayment.mockReturnValue(throwError(() => ({ error: 'String payment fail' })));
    component.startCheckout();
    expect(component.errorMessage).toBe('String payment fail');

    paymentServiceSpy.processPayment.mockReturnValue(throwError(() => ({})));
    component.startCheckout();
    expect(component.errorMessage).toBe('Failed to start Stripe checkout.');
  });
});
