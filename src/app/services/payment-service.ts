import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentRequest } from '../models/payment-request';
import { PaymentResponse } from '../models/payment-response';
import { environment } from '../../environments';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  // private api = 'http://localhost:8080/api/payment';

  constructor(private http: HttpClient) {}

  processPayment(paymentRequest: PaymentRequest) : Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${environment.apiUrl}/payment`, paymentRequest);
  }

  confirmStripeSession(sessionId: string): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${environment.apiUrl}/payment/confirm`, null, {
      params: { sessionId },
    });
  }
}
