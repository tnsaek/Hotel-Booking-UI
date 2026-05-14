import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Hotel } from '../models/hotel';
import { Room } from '../models/room';
import { HotelService } from '../services/hotel-service';

export interface HotelDetailData {
  hotel: Hotel | null;
  rooms: Room[];
}

export const hotelDetailResolver: ResolveFn<HotelDetailData> = (route: ActivatedRouteSnapshot) => {
  const hotelService = inject(HotelService);
  const hotelId = Number(route.paramMap.get('id'));

  return forkJoin({
    hotel: hotelService.getHotelById(hotelId).pipe(catchError(() => of(null))),
    rooms: hotelService.getRoomsByHotel(hotelId).pipe(catchError(() => of([]))),
  }).pipe(map(({ hotel, rooms }) => ({ hotel, rooms })));
};
