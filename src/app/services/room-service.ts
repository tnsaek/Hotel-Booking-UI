import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments';
import { Room } from '../models/room';

export type RoomPayload = Omit<Room, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private api = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  getRoomsByHotel(hotelId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.api}/hotel/${hotelId}`);
  }

  createRoom(room: RoomPayload): Observable<Room> {
    return this.http.post<Room>(this.api, room);
  }

  updateRoom(id: number, room: RoomPayload): Observable<Room> {
    return this.http.put<Room>(`${this.api}/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
