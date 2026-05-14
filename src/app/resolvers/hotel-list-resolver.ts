import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Hotel } from '../models/hotel';
import { HotelService } from '../services/hotel-service';

export const hotelListResolver: ResolveFn<Hotel[]> = () => {
  return inject(HotelService).getHotels().pipe(catchError(() => of([])));
};
