import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { Room } from '../models/room';
import { RoomPayload, RoomService } from './room-service';

describe('RoomService', () => {
  let service: RoomService;
  let httpMock: HttpTestingController;

  const room: Room = {
    id: 1,
    roomNumber: 101,
    type: 'SUITE',
    price: 250,
    available: true,
    description: 'Corner room',
    hotelId: 9,
  };

  const payload: RoomPayload = {
    roomNumber: 101,
    type: 'SUITE',
    price: 250,
    available: true,
    description: 'Corner room',
    hotelId: 9,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RoomService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get rooms by hotel', () => {
    service.getRoomsByHotel(9).subscribe((rooms) => expect(rooms).toEqual([room]));

    const request = httpMock.expectOne(`${environment.apiUrl}/rooms/hotel/9`);
    expect(request.request.method).toBe('GET');
    request.flush([room]);
  });

  it('should create, update, and delete rooms', () => {
    service.createRoom(payload).subscribe((response) => expect(response).toEqual(room));
    let request = httpMock.expectOne(`${environment.apiUrl}/rooms`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(room);

    service.updateRoom(1, payload).subscribe((response) => expect(response).toEqual(room));
    request = httpMock.expectOne(`${environment.apiUrl}/rooms/1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush(room);

    service.deleteRoom(1).subscribe((response) => expect(response).toBeNull());
    request = httpMock.expectOne(`${environment.apiUrl}/rooms/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
