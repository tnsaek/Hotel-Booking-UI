import { Routes } from '@angular/router';
import { HotelList } from './features/hotel/hotel-list/hotel-list';
import { HotelDetail } from './features/hotel/hotel-detail/hotel-detail';
import { BookingForm } from './features/booking/booking-form/booking-form';
import { PaymentForm } from './features/payment/payment-form/payment-form';
import { PaymentSuccess } from './features/payment/payment-success/payment-success';

export const routes: Routes = [
    { path: '', component: HotelList },
    {path: 'hotels/:id', component: HotelDetail},
    {path: 'booking/:roomId', component: BookingForm},
    {path: 'payment/:bookingId', component: PaymentForm},
    {path: 'payment-success', component: PaymentSuccess}
];
