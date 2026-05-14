import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetail } from './hotel-detail';

describe('HotelDetail', () => {
  let component: HotelDetail;
  let fixture: ComponentFixture<HotelDetail>;
  let routeStub: any;
  let dataSubject: any;

  beforeEach(async () => {
    dataSubject = { subscribe: jest.fn() };
    routeStub = { data: dataSubject };
    await TestBed.configureTestingModule({
      imports: [HotelDetail],
      providers: [
        { provide: 'ActivatedRoute', useValue: routeStub },
      ],
    }).overrideComponent(HotelDetail, {
      set: {
        providers: [
          { provide: 'ActivatedRoute', useValue: routeStub },
        ],
      },
    }).compileComponents();
    fixture = TestBed.createComponent(HotelDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set hotel and availableRooms from route data', () => {
    const hotel = { id: 1, name: 'Test Hotel' };
    const rooms = [
      { id: 1, available: true },
      { id: 2, available: false },
      { id: 3, available: true },
    ];
    // Mock subscribe
    dataSubject.subscribe.mockImplementation((cb: any) => {
      cb({ detail: { hotel, rooms } });
    });
    component.ngOnInit();
    expect(component.hotel).toEqual(hotel);
    expect(component.availableRooms).toEqual([
      { id: 1, available: true },
      { id: 3, available: true },
    ]);
    expect(component.errorMessage).toBe('');
  });

  it('should set errorMessage if hotel is missing', () => {
    dataSubject.subscribe.mockImplementation((cb: any) => {
      cb({ detail: { hotel: null, rooms: [] } });
    });
    component.ngOnInit();
    expect(component.hotel).toBeNull();
    expect(component.errorMessage).toBe('Failed to load hotel details.');
  });
});
