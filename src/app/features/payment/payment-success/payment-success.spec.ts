import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { BookingService } from '../../../services/booking-service';
import { PaymentService } from '../../../services/payment-service';
import { PaymentSuccess } from './payment-success';

describe('PaymentSuccess', () => {
  let component: PaymentSuccess;
  let fixture: ComponentFixture<PaymentSuccess>;
  let paymentServiceSpy: {
    confirmStripeSession: ReturnType<typeof vi.fn>;
  };
  let bookingServiceSpy: {
    requestBookingsRefresh: ReturnType<typeof vi.fn>;
  };
  let sessionId: string | null;

  beforeEach(async () => {
    sessionStorage.clear();
    sessionId = null;
    paymentServiceSpy = {
      confirmStripeSession: vi.fn().mockReturnValue(of({
        status: 'SUCCESS',
        transactionId: 'txn_123',
        checkoutUrl: '',
      })),
    };
    bookingServiceSpy = {
      requestBookingsRefresh: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PaymentSuccess],
      providers: [
        provideRouter([]),
        { provide: PaymentService, useValue: paymentServiceSpy },
        { provide: BookingService, useValue: bookingServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => sessionId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentSuccess);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show completed message without confirming when session id is missing', () => {
    fixture.detectChanges();

    expect(component.confirmationMessage).toBe('Payment completed.');
    expect(component.isConfirming).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(paymentServiceSpy.confirmStripeSession).not.toHaveBeenCalled();
    expect(bookingServiceSpy.requestBookingsRefresh).not.toHaveBeenCalled();
    expect(textContent()).toContain('Payment Successful');
    expect(textContent()).toContain('Payment completed.');
  });

  it('should confirm Stripe session, flag booking refresh, and show confirmed message', () => {
    sessionId = 'cs_test_123';

    fixture.detectChanges();

    expect(paymentServiceSpy.confirmStripeSession).toHaveBeenCalledWith('cs_test_123');
    expect(component.confirmationMessage).toBe('Your booking has been confirmed.');
    expect(sessionStorage.getItem('refresh_bookings_after_payment')).toBe('true');
    expect(bookingServiceSpy.requestBookingsRefresh).toHaveBeenCalled();
    expect(component.isConfirming).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(textContent()).toContain('Your booking has been confirmed.');
  });

  it('should render the bookings router link', () => {
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a');
    const routerLink = fixture.debugElement.query(By.directive(RouterLink));

    expect(link.textContent.trim()).toBe('View My Bookings');
    expect(routerLink.attributes['routerLink']).toBe('/my-bookings');
  });

  it('should show confirmation error from an error object', () => {
    sessionId = 'cs_test_123';
    paymentServiceSpy.confirmStripeSession.mockReturnValue(
      throwError(() => ({ error: { message: 'Confirmation failed' } }))
    );

    fixture.detectChanges();

    expect(component.errorMessage).toBe('Confirmation failed');
    expect(component.isConfirming).toBe(false);
    expect(component.confirmationMessage).toBe('Confirming your payment...');
    expect(bookingServiceSpy.requestBookingsRefresh).not.toHaveBeenCalled();
    expect(textContent()).toContain('Confirmation failed');
  });

  it('should show confirmation error from a string response', () => {
    sessionId = 'cs_test_123';
    paymentServiceSpy.confirmStripeSession.mockReturnValue(
      throwError(() => ({ error: 'String confirmation failure' }))
    );

    fixture.detectChanges();

    expect(component.errorMessage).toBe('String confirmation failure');
    expect(component.isConfirming).toBe(false);
  });

  it('should show default confirmation error', () => {
    sessionId = 'cs_test_123';
    paymentServiceSpy.confirmStripeSession.mockReturnValue(throwError(() => ({})));

    fixture.detectChanges();

    expect(component.errorMessage).toBe('Payment completed, but confirmation failed.');
    expect(component.isConfirming).toBe(false);
  });
});
