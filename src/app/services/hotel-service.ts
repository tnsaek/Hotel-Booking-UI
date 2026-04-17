import { Injectable } from '@angular/core';
import { Hotel } from '../models/hotel';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { Room } from '../models/room';

@Injectable({
  providedIn: 'root',
})
export class HotelService {
  private api = 'http://localhost:8080/api/hotels';

  constructor(private http: HttpClient) {}

  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.api);
  }

  getHotelById(id: number): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.api}/${id}`);
  }

  getRoomsByHotel(id: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.api}/${id}/rooms`);
  }
}

