import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { Hotel } from '../../../models/hotel';
import { Room } from '../../../models/room';
import { HotelDetailData } from '../../../resolvers/hotel-detail-resolver';
import { HotelDetail } from './hotel-detail';

describe('HotelDetail', () => {
  let component: HotelDetail;
  let fixture: ComponentFixture<HotelDetail>;
  let routeData$: BehaviorSubject<Data>;

  const hotel: Hotel = {
    id: 7,
    name: 'Harbor Grand',
    location: 'Boston',
    description: 'Waterfront rooms with city views.',
  };

  const availableRoom: Room = {
    id: 11,
    roomNumber: 301,
    type: 'Suite',
    price: 240,
    available: true,
    hotelId: hotel.id,
  };

  const unavailableRoom: Room = {
    id: 12,
    roomNumber: 302,
    type: 'Queen',
    price: 160,
    available: false,
    hotelId: hotel.id,
  };

  beforeEach(async () => {
    routeData$ = new BehaviorSubject<Data>({});

    await TestBed.configureTestingModule({
      imports: [HotelDetail],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: routeData$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelDetail);
    component = fixture.componentInstance;
  });

  function emitDetail(detail?: HotelDetailData): void {
    routeData$.next(detail === undefined ? {} : { detail });
    fixture.detectChanges();
  }

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hotel details and render only available resolver rooms', () => {
    emitDetail({ hotel, rooms: [availableRoom, unavailableRoom] });

    expect(component.hotel).toEqual(hotel);
    expect(component.availableRooms).toEqual([availableRoom]);
    expect(component.errorMessage).toBe('');

    const pageText = textContent();
    expect(pageText).toContain('Harbor Grand');
    expect(pageText).toContain('Boston');
    expect(pageText).toContain('Waterfront rooms with city views.');
    expect(pageText).toContain('Available Rooms');
    expect(pageText).toContain('Type: Suite');
    expect(pageText).toContain('Price: $240');
    expect(pageText).toContain('Book Now');
    expect(pageText).not.toContain('Queen');
    expect(pageText).not.toContain('No available rooms for this hotel.');

    const [bookButton] = buttons();
    expect(bookButton.disabled).toBe(false);
  });

  it('should show the empty-room state when a hotel has no available rooms', () => {
    emitDetail({ hotel, rooms: [unavailableRoom] });

    expect(component.hotel).toEqual(hotel);
    expect(component.availableRooms).toEqual([]);
    expect(component.errorMessage).toBe('');
    expect(textContent()).toContain('No available rooms for this hotel.');
    expect(buttons()).toEqual([]);
  });

  it('should default missing rooms to an empty list', () => {
    emitDetail({ hotel, rooms: undefined as unknown as Room[] });

    expect(component.hotel).toEqual(hotel);
    expect(component.availableRooms).toEqual([]);
    expect(component.errorMessage).toBe('');
    expect(textContent()).toContain('No available rooms for this hotel.');
  });

  it('should show an error when resolver data has no hotel', () => {
    emitDetail({ hotel: null, rooms: [availableRoom] });

    expect(component.hotel).toBeNull();
    expect(component.availableRooms).toEqual([availableRoom]);
    expect(component.errorMessage).toBe('Failed to load hotel details.');
    expect(textContent()).toBe('Failed to load hotel details.');
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
  });

  it('should show an error when route detail data is missing', () => {
    emitDetail();

    expect(component.hotel).toBeNull();
    expect(component.availableRooms).toEqual([]);
    expect(component.errorMessage).toBe('Failed to load hotel details.');
    expect(textContent()).toBe('Failed to load hotel details.');
  });

});
