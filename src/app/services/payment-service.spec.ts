import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { PaymentRequest } from '../models/payment-request';
import { PaymentResponse } from '../models/payment-response';
import { PaymentService } from './payment-service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const paymentRequest: PaymentRequest = {
    bookingId: 12,
    amount: 250,
  };

  const paymentResponse: PaymentResponse = {
    status: 'SUCCESS',
    transactionId: 'txn_123',
    checkoutUrl: 'https://checkout.example/session',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process a payment', () => {
    service.processPayment(paymentRequest).subscribe((response) => {
      expect(response).toEqual(paymentResponse);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/payment`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(paymentRequest);
    request.flush(paymentResponse);
  });

  it('should confirm a Stripe session', () => {
    service.confirmStripeSession('cs_test_123').subscribe((response) => {
      expect(response).toEqual(paymentResponse);
    });

    const request = httpMock.expectOne(
      (req) => req.url === `${environment.apiUrl}/payment/confirm`
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.params.get('sessionId')).toBe('cs_test_123');
    request.flush(paymentResponse);
  });
});
