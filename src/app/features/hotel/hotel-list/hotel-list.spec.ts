import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { Hotel } from '../../../models/hotel';
import { HotelList } from './hotel-list';

describe('HotelList', () => {
  let component: HotelList;
  let fixture: ComponentFixture<HotelList>;
  let routeData$: Subject<{ hotels?: Hotel[] }>;

  const hotels: Hotel[] = [
    {
      id: 1,
      name: 'Harbor Grand',
      location: 'Boston',
      description: 'Waterfront rooms',
    },
    {
      id: 2,
      name: 'City Suites',
      location: 'New York',
      description: 'Downtown suites',
    },
  ];

  beforeEach(async () => {
    routeData$ = new Subject<{ hotels?: Hotel[] }>();

    await TestBed.configureTestingModule({
      imports: [HotelList],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: routeData$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelList);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function hotelCards(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.card'));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the loading state before route data resolves', () => {
    fixture.detectChanges();

    expect(component.isLoading).toBe(true);
    expect(textContent()).toContain('Loading hotels...');
  });

  it('should use an empty list when route data does not include hotels', () => {
    component.ngOnInit();
    routeData$.next({});

    expect(component.hotels).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should use hotels from route data', () => {
    component.ngOnInit();
    routeData$.next({ hotels });

    expect(component.hotels).toEqual(hotels);
    expect(component.isLoading).toBe(false);
  });

  it('should render the empty state when route data includes no hotels', () => {
    component.hotels = [];
    component.isLoading = false;

    fixture.detectChanges();

    expect(component.hotels).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(textContent()).toContain('No hotels available.');
  });

  it('should render an error message instead of the empty state', () => {
    component.hotels = [];
    component.isLoading = false;
    component.errorMessage = 'Failed to load hotels.';

    fixture.detectChanges();

    expect(textContent()).toContain('Failed to load hotels.');
    expect(textContent()).not.toContain('No hotels available.');
  });

  it('should render hotel cards with detail links', () => {
    component.hotels = hotels;
    component.isLoading = false;

    fixture.detectChanges();

    expect(component.hotels).toEqual(hotels);
    expect(component.isLoading).toBe(false);

    const cards = hotelCards();
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Harbor Grand');
    expect(cards[0].textContent).toContain('Boston');
    expect(cards[1].textContent).toContain('City Suites');
    expect(cards[1].textContent).toContain('New York');

    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('View Details');
  });
});
