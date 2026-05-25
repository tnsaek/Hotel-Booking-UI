import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel';
import { map, Observable, timeout } from 'rxjs';
import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { Room } from '../models/room';
import { environment } from '../../environments';
import { ExternalHotelOffer } from '../models/external-hotel-offer';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root',
})
export class HotelService {
  private api = `${environment.apiUrl}/hotels`;
  private publicHttp: HttpClient;

  constructor(
    private http: HttpClient,
    httpBackend: HttpBackend
  ) {
    this.publicHttp = new HttpClient(httpBackend);
  }

  getHotels(): Observable<Hotel[]> {
    return this.publicHttp
      .get<PagedResponse<Hotel> | Hotel[]>(`${this.api}?size=100`)
      .pipe(
        timeout(10000),
        map((response) => this.extractHotels(response))
      );
  }

  getHotelsPage(): Observable<PagedResponse<Hotel>> {
    return this.http.get<PagedResponse<Hotel>>(`${this.api}?size=100`);
  }

  getHotelById(id: number): Observable<Hotel> {
    return this.publicHttp.get<Hotel>(`${environment.apiUrl}/hotels/${id}`);
  }

  getRoomsByHotel(hotelId: number): Observable<Room[]> {
    return this.publicHttp.get<Room[]>(`${environment.apiUrl}/rooms/hotel/${hotelId}`);
  }

  searchHotels(query: string, location?: string): Observable<Hotel[]> {
    let params = '';
    if (query) {
      params += `name=${encodeURIComponent(query)}`;
    }
    if (location) {
      params += params ? '&' : '';
      params += `location=${encodeURIComponent(location)}`;
    }
    const queryString = params ? `${params}&size=100` : 'size=100';
    const url = params ? `${this.api}/search?${queryString}` : `${this.api}?${queryString}`;
    return this.publicHttp
      .get<PagedResponse<Hotel> | Hotel[]>(url)
      .pipe(
        timeout(10000),
        map((response) => this.extractHotels(response))
      );
  }

  searchHotelsByLocation(location: string): Observable<Hotel[]> {
    return this.http
      .get<PagedResponse<Hotel> | Hotel[]>(`${this.api}?location=${encodeURIComponent(location)}&size=100`)
      .pipe(map((response) => this.extractHotels(response)));
  }

  searchLiteApiHotels(criteria: {
    cityName: string;
    countryCode: string;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    roomQuantity: number;
    currency: string;
    guestNationality: string;
  }): Observable<ExternalHotelOffer[]> {
    const params = new HttpParams()
      .set('cityName', criteria.cityName)
      .set('countryCode', criteria.countryCode)
      .set('checkInDate', criteria.checkInDate)
      .set('checkOutDate', criteria.checkOutDate)
      .set('adults', criteria.adults)
      .set('roomQuantity', criteria.roomQuantity)
      .set('currency', criteria.currency)
      .set('guestNationality', criteria.guestNationality);

    return this.publicHttp
      .get<ExternalHotelOffer[]>(`${this.api}/liteapi/search`, { params })
      .pipe(timeout(10000));
  }

  createLiteApiBookableRoom(hotel: ExternalHotelOffer): Observable<Room> {
    return this.publicHttp.post<Room>(`${this.api}/liteapi/bookable-room`, {
      hotelId: hotel.hotelId,
      name: hotel.name,
      location: hotel.cityCode,
      address: hotel.address,
      description: hotel.description,
      priceTotal: hotel.priceTotal,
    });
  }

  createHotel(hotel: Omit<Hotel, 'id'>): Observable<Hotel> {
    return this.http.post<Hotel>(this.api, hotel);
  }

  updateHotel(id: number, hotel: Omit<Hotel, 'id'>): Observable<Hotel> {
    return this.http.put<Hotel>(`${this.api}/${id}`, hotel);
  }

  deleteHotel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  private extractHotels(response: PagedResponse<Hotel> | Hotel[]): Hotel[] {
    if (Array.isArray(response)) {
      return response;
    }

    return response.content ?? [];
  }
}
