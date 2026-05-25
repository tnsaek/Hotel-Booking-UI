import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { ExternalHotelOffer } from '../../../models/external-hotel-offer';
import { HotelService } from '../../../services/hotel-service';
import { HotelSearch } from './hotel-search';

describe('HotelSearch', () => {
  let component: HotelSearch;
  let fixture: ComponentFixture<HotelSearch>;
  let routerNavigateSpy: ReturnType<typeof vi.spyOn>;
  let hotelServiceSpy: {
    searchLiteApiHotels: ReturnType<typeof vi.fn>;
    createLiteApiBookableRoom: ReturnType<typeof vi.fn>;
  };

  const offers: ExternalHotelOffer[] = [
    {
      provider: 'LiteAPI',
      hotelId: 'lp19d80',
      name: 'Paris Central',
      cityCode: 'PAR',
      address: '1 Rue Example',
      offerId: 'OFFER-1',
      checkInDate: '2026-06-01',
      checkOutDate: '2026-06-05',
      roomType: 'Deluxe King Room',
      description: 'Breakfast Included',
      priceTotal: '420.00',
      currency: 'USD',
    },
  ];

  beforeEach(async () => {
    hotelServiceSpy = {
      searchLiteApiHotels: vi.fn().mockReturnValue(of(offers)),
      createLiteApiBookableRoom: vi.fn().mockReturnValue(of({ id: 12 })),
    };

    await TestBed.configureTestingModule({
      imports: [HotelSearch],
      providers: [
        provideRouter([]),
        { provide: HotelService, useValue: hotelServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelSearch);
    component = fixture.componentInstance;
    routerNavigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function inputById(id: string): HTMLInputElement {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`Expected input #${id} to exist`);
    }
    return input;
  }

  function buttonByText(text: string): HTMLButtonElement {
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'));
    const button = buttons.find((candidate) => candidate.textContent?.includes(text));
    if (!button) {
      throw new Error(`Expected button containing "${text}" to exist`);
    }
    return button;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize default LiteAPI search fields', () => {
    fixture.detectChanges();

    expect(component.cityName).toBe('');
    expect(component.countryCode).toBe('US');
    expect(component.adults).toBe(1);
    expect(component.roomQuantity).toBe(1);
    expect(component.currency).toBe('USD');
    expect(component.guestNationality).toBe('US');
    expect(component.checkInDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.checkOutDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(textContent()).toContain('Enter a destination and dates to search LiteAPI hotel offers.');
  });

  it('should search LiteAPI hotels with normalized criteria', async () => {
    component.cityName = ' paris ';
    component.countryCode = 'fr';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';
    component.adults = 2;
    component.roomQuantity = 1;
    component.currency = 'usd';
    component.guestNationality = 'us';

    await component.onSearch();

    expect(hotelServiceSpy.searchLiteApiHotels).toHaveBeenCalledWith({
      cityName: 'paris',
      countryCode: 'FR',
      checkInDate: '2026-06-01',
      checkOutDate: '2026-06-05',
      adults: 2,
      roomQuantity: 1,
      currency: 'USD',
      guestNationality: 'US',
    });
    expect(component.searchResults).toEqual(offers);
    expect(component.isSearching).toBe(false);
  });

  it('should load all hotels through the search action', async () => {
    const searchSpy = vi.spyOn(component, 'onSearch').mockResolvedValue();

    component.loadAllHotels();

    expect(searchSpy).toHaveBeenCalled();
  });

  it('should use fallback currency and guest nationality when those fields are blank', async () => {
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';
    component.currency = ' ';
    component.guestNationality = '';

    await component.onSearch();

    expect(hotelServiceSpy.searchLiteApiHotels).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'USD',
        guestNationality: 'US',
      })
    );
  });

  it('should reject blank city names before calling the backend', async () => {
    component.cityName = ' ';
    component.countryCode = 'FR';

    await component.onSearch();

    expect(hotelServiceSpy.searchLiteApiHotels).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('Enter a city name');
  });

  it('should reject invalid country codes before calling the backend', async () => {
    component.cityName = 'Paris';
    component.countryCode = 'France';

    await component.onSearch();

    expect(hotelServiceSpy.searchLiteApiHotels).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('2-letter country code');
  });

  it('should show an error when LiteAPI search fails', async () => {
    hotelServiceSpy.searchLiteApiHotels.mockReturnValue(throwError(() => ({})));
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    await component.onSearch();

    expect(component.searchResults).toEqual([]);
    expect(component.isSearching).toBe(false);
    expect(component.errorMessage).toContain('Failed to search LiteAPI hotels');
  });

  it('should show a timeout message when search takes too long', async () => {
    vi.useFakeTimers();
    hotelServiceSpy.searchLiteApiHotels.mockReturnValue(new Observable<ExternalHotelOffer[]>());
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    const searchPromise = component.onSearch();
    await vi.advanceTimersByTimeAsync(12000);
    await searchPromise;
    vi.useRealTimers();

    expect(component.searchResults).toEqual([]);
    expect(component.isSearching).toBe(false);
    expect(component.errorMessage).toContain('Search timed out');
  });

  it('should ignore stale successful search results after reset', async () => {
    let emitResults!: (results: ExternalHotelOffer[]) => void;
    hotelServiceSpy.searchLiteApiHotels.mockReturnValue(
      new Observable<ExternalHotelOffer[]>((subscriber) => {
        emitResults = (results) => {
          subscriber.next(results);
          subscriber.complete();
        };
      })
    );
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    const searchPromise = component.onSearch();
    component.resetSearch();
    emitResults(offers);
    await searchPromise;

    expect(component.searchResults).toEqual([]);
    expect(component.isSearching).toBe(true);
    expect(component.errorMessage).toBe('');
  });

  it('should ignore stale failed search results after reset', async () => {
    let emitError!: () => void;
    hotelServiceSpy.searchLiteApiHotels.mockReturnValue(
      new Observable<ExternalHotelOffer[]>((subscriber) => {
        emitError = () => subscriber.error(new Error('network failed'));
      })
    );
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    const searchPromise = component.onSearch();
    component.resetSearch();
    emitError();
    await searchPromise;

    expect(component.errorMessage).toBe('');
    expect(component.isSearching).toBe(true);
  });

  it('should render matching offer cards after a search', async () => {
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    await component.onSearch();
    fixture.detectChanges();

    expect(textContent()).toContain('Found 1 LiteAPI hotel offer(s)');
    expect(textContent()).toContain('Paris Central');
    expect(textContent()).toContain('Deluxe King Room');
    expect(textContent()).toContain('Breakfast Included');
    expect(textContent()).toContain('USD 420.00');
  });

  it('should render no-results state after an empty completed search', async () => {
    hotelServiceSpy.searchLiteApiHotels.mockReturnValue(of([]));
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    await component.onSearch();
    fixture.detectChanges();

    expect(textContent()).toContain('No LiteAPI hotel offers found for this search.');
  });

  it('should omit optional offer details when an offer does not include them', async () => {
    hotelServiceSpy.searchLiteApiHotels.mockReturnValue(of([
      {
        provider: 'LiteAPI',
        hotelId: 'minimal-hotel',
        name: 'Minimal Hotel',
        cityCode: 'PAR',
      },
    ]));
    component.cityName = 'Paris';
    component.countryCode = 'FR';
    component.checkInDate = '2026-06-01';
    component.checkOutDate = '2026-06-05';

    await component.onSearch();
    fixture.detectChanges();

    expect(textContent()).toContain('Minimal Hotel');
    expect(textContent()).not.toContain(' to ');
    expect(fixture.nativeElement.querySelector('.room-type')).toBeNull();
    expect(fixture.nativeElement.querySelector('.description')).toBeNull();
    expect(fixture.nativeElement.querySelector('.price')).toBeNull();
  });

  it('should submit the search form through the template binding', () => {
    const searchSpy = vi.spyOn(component, 'onSearch').mockResolvedValue();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit');

    expect(searchSpy).toHaveBeenCalled();
  });

  it('should update every search field through template ngModel bindings', () => {
    fixture.detectChanges();

    fixture.debugElement.query(By.css('#cityName')).triggerEventHandler('ngModelChange', 'Rome');
    fixture.debugElement.query(By.css('#countryCode')).triggerEventHandler('ngModelChange', 'IT');
    fixture.debugElement.query(By.css('#checkInDate')).triggerEventHandler('ngModelChange', '2026-07-01');
    fixture.debugElement.query(By.css('#checkOutDate')).triggerEventHandler('ngModelChange', '2026-07-03');
    fixture.debugElement.query(By.css('#adults')).triggerEventHandler('ngModelChange', 4);
    fixture.debugElement.query(By.css('#roomQuantity')).triggerEventHandler('ngModelChange', 2);
    fixture.debugElement.query(By.css('#currency')).triggerEventHandler('ngModelChange', 'EUR');

    expect(component.cityName).toBe('Rome');
    expect(component.countryCode).toBe('IT');
    expect(component.checkInDate).toBe('2026-07-01');
    expect(component.checkOutDate).toBe('2026-07-03');
    expect(component.adults).toBe(4);
    expect(component.roomQuantity).toBe(2);
    expect(component.currency).toBe('EUR');
  });

  it('should reset through the template reset button', () => {
    component.cityName = 'Toronto';
    component.hasSearched = true;
    component.searchResults = offers;
    fixture.detectChanges();

    buttonByText('Reset').click();
    fixture.detectChanges();

    expect(component.cityName).toBe('');
    expect(component.hasSearched).toBe(false);
    expect(component.searchResults).toEqual([]);
  });

  it('should reset search fields, messages, and results', () => {
    component.cityName = 'Toronto';
    component.countryCode = 'CA';
    component.adults = 3;
    component.roomQuantity = 2;
    component.currency = 'EUR';
    component.guestNationality = 'CA';
    component.hasSearched = true;
    component.errorMessage = 'Previous error';
    component.searchResults = offers;

    component.resetSearch();
    fixture.detectChanges();

    expect(component.cityName).toBe('');
    expect(component.countryCode).toBe('US');
    expect(component.adults).toBe(1);
    expect(component.roomQuantity).toBe(1);
    expect(component.currency).toBe('USD');
    expect(component.guestNationality).toBe('US');
    expect(component.hasSearched).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(component.searchResults).toEqual([]);
  });

  it('should prepare a LiteAPI hotel for booking and navigate to booking form', () => {
    component.bookHotel(offers[0]);

    expect(hotelServiceSpy.createLiteApiBookableRoom).toHaveBeenCalledWith(offers[0]);
    expect(component.bookingHotelId).toBe('');
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/booking', 12], {
      queryParams: {
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
      },
    });
  });

  it('should prepare a LiteAPI hotel for booking from the template button', async () => {
    component.searchResults = offers;
    component.hasSearched = true;
    fixture.detectChanges();

    buttonByText('Book Now').click();
    await fixture.whenStable();

    expect(hotelServiceSpy.createLiteApiBookableRoom).toHaveBeenCalledWith(offers[0]);
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/booking', 12], {
      queryParams: {
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
      },
    });
  });

  it('should render searching and booking disabled states', () => {
    component.isSearching = true;
    component.searchResults = offers;
    component.hasSearched = true;
    component.bookingHotelId = offers[0].hotelId;
    fixture.detectChanges();

    expect(buttonByText('Searching...').disabled).toBe(true);
    expect(buttonByText('Reset').disabled).toBe(true);
    expect(buttonByText('Preparing...').disabled).toBe(true);
  });

  it('should show an error when LiteAPI hotel booking preparation fails', () => {
    hotelServiceSpy.createLiteApiBookableRoom.mockReturnValue(throwError(() => ({})));

    component.bookHotel(offers[0]);

    expect(component.bookingHotelId).toBe('');
    expect(component.errorMessage).toBe('Unable to prepare this LiteAPI hotel for booking. Please try another hotel.');
    expect(routerNavigateSpy).not.toHaveBeenCalled();
  });
});
