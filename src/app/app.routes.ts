import { Routes } from '@angular/router';
import { About } from './features/about/about';
import { HotelSearch } from './features/hotel/hotel-search/hotel-search';
import { HotelList } from './features/hotel/hotel-list/hotel-list';
import { HotelDetail } from './features/hotel/hotel-detail/hotel-detail';
import { BookingForm } from './features/booking/booking-form/booking-form';
import { PaymentForm } from './features/payment/payment-form/payment-form';
import { PaymentSuccess } from './features/payment/payment-success/payment-success';
import { PaymentFailure } from './features/payment/payment-failure/payment-failure';
import { BookingSummary } from './features/booking/booking-summary/booking-summary';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ManageHotels } from './features/admin/manage-hotels/manage-hotels';
import { ManageRooms } from './features/admin/manage-rooms/manage-rooms';
import { adminGuard } from './guards/admin-guard';
import { hotelListResolver } from './resolvers/hotel-list-resolver';
import { hotelDetailResolver } from './resolvers/hotel-detail-resolver';

export const routes: Routes = [
    { path: '', component: About },
    { path: 'search', component: HotelSearch },
    { path: 'hotels', component: HotelList, resolve: { hotels: hotelListResolver } },
    { path: 'hotel/:id', component: HotelDetail, resolve: { detail: hotelDetailResolver } },
    { path: 'booking/:roomId', component: BookingForm },
    { path: 'payment/:bookingId', component: PaymentForm },
    { path: 'payment-success', component: PaymentSuccess },
    { path: 'payment-failure', component: PaymentFailure },
    { path: 'my-bookings', component: BookingSummary },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'admin/hotels', component: ManageHotels, canActivate: [adminGuard] },
    { path: 'admin/rooms', component: ManageRooms, canActivate: [adminGuard] }
];
