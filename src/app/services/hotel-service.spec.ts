import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { Hotel } from '../models/hotel';
import { Room } from '../models/room';
import { HotelService, PagedResponse } from './hotel-service';

describe('HotelService', () => {
  let service: HotelService;
  let httpMock: HttpTestingController;

  const hotel: Hotel = {
    id: 1,
    name: 'Harbor Grand',
    location: 'Boston',
    description: 'Waterfront rooms',
  };

  const room: Room = {
    id: 4,
    roomNumber: 101,
    type: 'SUITE',
    price: 250,
    available: true,
    hotelId: 1,
  };

  const page: PagedResponse<Hotel> = {
    content: [hotel],
    totalElements: 1,
    totalPages: 1,
    size: 100,
    number: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HotelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get hotels from a paged response', () => {
    service.getHotels().subscribe((hotels) => {
      expect(hotels).toEqual([hotel]);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/hotels?size=100`);
    expect(request.request.method).toBe('GET');
    request.flush(page);
  });

  it('should get hotels from an array response', () => {
    service.getHotels().subscribe((hotels) => {
      expect(hotels).toEqual([hotel]);
    });

    httpMock.expectOne(`${environment.apiUrl}/hotels?size=100`).flush([hotel]);
  });

  it('should get an admin hotels page', () => {
    service.getHotelsPage().subscribe((response) => {
      expect(response).toEqual(page);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/hotels?size=100`);
    expect(request.request.method).toBe('GET');
    request.flush(page);
  });

  it('should get a hotel by id', () => {
    service.getHotelById(1).subscribe((response) => {
      expect(response).toEqual(hotel);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/hotels/1`);
    expect(request.request.method).toBe('GET');
    request.flush(hotel);
  });

  it('should get rooms by hotel', () => {
    service.getRoomsByHotel(1).subscribe((rooms) => {
      expect(rooms).toEqual([room]);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/rooms/hotel/1`);
    expect(request.request.method).toBe('GET');
    request.flush([room]);
  });

  it('should search hotels with name and location', () => {
    service.searchHotels('Grand Hotel', 'New York').subscribe((hotels) => {
      expect(hotels).toEqual([hotel]);
    });

    const request = httpMock.expectOne(
      `${environment.apiUrl}/hotels/search?name=Grand%20Hotel&location=New%20York&size=100`
    );
    expect(request.request.method).toBe('GET');
    request.flush(page);
  });

  it('should search hotels with only location', () => {
    service.searchHotels('', 'New York').subscribe((hotels) => {
      expect(hotels).toEqual([hotel]);
    });

    httpMock
      .expectOne(`${environment.apiUrl}/hotels/search?location=New%20York&size=100`)
      .flush([hotel]);
  });

  it('should search hotels with no params using base hotel endpoint', () => {
    service.searchHotels('', '').subscribe((hotels) => {
      expect(hotels).toEqual([hotel]);
    });

    httpMock.expectOne(`${environment.apiUrl}/hotels?size=100`).flush(page);
  });

  it('should search hotels by location through admin client', () => {
    service.searchHotelsByLocation('New York').subscribe((hotels) => {
      expect(hotels).toEqual([hotel]);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/hotels?location=New%20York&size=100`);
    expect(request.request.method).toBe('GET');
    request.flush(page);
  });

  it('should create, update, and delete hotels', () => {
    const payload = { name: 'A', location: 'B', description: 'C' };

    service.createHotel(payload).subscribe((response) => expect(response).toEqual(hotel));
    let request = httpMock.expectOne(`${environment.apiUrl}/hotels`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(hotel);

    service.updateHotel(1, payload).subscribe((response) => expect(response).toEqual(hotel));
    request = httpMock.expectOne(`${environment.apiUrl}/hotels/1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush(hotel);

    service.deleteHotel(1).subscribe((response) => expect(response).toBeNull());
    request = httpMock.expectOne(`${environment.apiUrl}/hotels/1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
