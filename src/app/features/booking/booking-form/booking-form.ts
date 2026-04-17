import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from '../../../services/booking-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrl: './booking-form.scss',
})
export class BookingForm implements OnInit {

  roomId!: number;
  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.roomId = Number(this.route.snapshot.paramMap.get('roomId'));
  }

  submit(): void{
    if(this.form.invalid) return;

    const request = {
      userId : 1, // TODO: Get from auth service
      roomId: this.roomId,
      checkIn: this.form.value.checkIn!,
      checkOut: this.form.value.checkOut!,
    };

    this.bookingService.createBooking(request).subscribe(response =>{
      this.router.navigate(['/payment', response.bookingId]);
    });
  }
}
