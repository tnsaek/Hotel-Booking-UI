import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel';
import { map, Observable, timeout } from 'rxjs';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Room } from '../models/room';
import { environment } from '../../environments';

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
