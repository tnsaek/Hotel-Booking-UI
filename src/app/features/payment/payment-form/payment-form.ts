import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../../services/payment-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss',
})
export class PaymentForm implements OnInit {

  bookingId! : number;
  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
    amount: ['', Validators.required],
    cardNumber: ['', Validators.required]
  });
  }

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId'));
  }

  submit() {
    if (this.form.invalid) return;

    const paymentRequest = {
      bookingId: this.bookingId,
      amount: Number(this.form.value.amount)
    };

    this.paymentService.processPayment(paymentRequest).subscribe(response =>{
      this.router.navigate(['/payment-success']);
    });
  }
}
