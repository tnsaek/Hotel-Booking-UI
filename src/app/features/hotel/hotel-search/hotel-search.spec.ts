import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Hotel } from '../../../models/hotel';
import { HotelService } from '../../../services/hotel-service';
import { HotelSearch } from './hotel-search';

describe('HotelSearch', () => {
  let component: HotelSearch;
  let fixture: ComponentFixture<HotelSearch>;
  let hotelServiceSpy: {
    getHotels: ReturnType<typeof vi.fn>;
  };

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
    {
      id: 3,
      name: 'Grand Central Inn',
      location: 'New York',
      description: 'Near transit',
    },
  ];

  beforeEach(async () => {
    hotelServiceSpy = {
      getHotels: vi.fn().mockReturnValue(of(hotels)),
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
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all hotels on init and render the welcome state', () => {
    fixture.detectChanges();

    expect(hotelServiceSpy.getHotels).toHaveBeenCalled();
    expect(component.allHotels).toEqual(hotels);
    expect(component.searchResults).toEqual([]);
    expect(component.isLoadingHotels).toBe(false);
    expect(component.hasSearched).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(textContent()).toContain('Enter a hotel name or location to get started');
  });

  it('should clear lists and show an error when hotel loading fails', () => {
    hotelServiceSpy.getHotels.mockReturnValue(throwError(() => ({})));

    fixture.detectChanges();

    expect(component.allHotels).toEqual([]);
    expect(component.searchResults).toEqual([]);
    expect(component.isLoadingHotels).toBe(false);
    expect(component.errorMessage).toBe(
      'Failed to load hotels. Check that the backend is running on http://localhost:8080.'
    );
    expect(textContent()).toContain('Failed to load hotels');
  });

  it('should search by trimmed case-insensitive hotel name', () => {
    component.allHotels = hotels;
    component.searchQuery = ' grand ';
    component.searchLocation = '';

    component.onSearch();

    expect(component.hasSearched).toBe(true);
    expect(component.errorMessage).toBe('');
    expect(component.searchResults).toEqual([hotels[0], hotels[2]]);
  });

  it('should search by trimmed case-insensitive location', () => {
    component.allHotels = hotels;
    component.searchQuery = '';
    component.searchLocation = ' new york ';

    component.onSearch();

    expect(component.searchResults).toEqual([hotels[1], hotels[2]]);
  });

  it('should search by both hotel name and location', () => {
    component.allHotels = hotels;
    component.searchQuery = 'grand';
    component.searchLocation = 'boston';

    component.onSearch();

    expect(component.searchResults).toEqual([hotels[0]]);
  });

  it('should return all hotels when both search fields are blank', () => {
    component.allHotels = hotels;
    component.searchQuery = '   ';
    component.searchLocation = '   ';

    component.onSearch();

    expect(component.searchResults).toEqual(hotels);
  });

  it('should render the no-results state when no hotels match', () => {
    component.loadAllHotels = () => undefined;
    component.allHotels = hotels;
    component.searchQuery = 'missing';
    component.searchLocation = 'nowhere';

    component.onSearch();
    fixture.detectChanges();

    expect(component.searchResults).toEqual([]);
    expect(textContent()).toContain('No hotels found matching your search. Try different keywords.');
  });

  it('should reset search fields, messages, and results', () => {
    component.searchQuery = 'grand';
    component.searchLocation = 'boston';
    component.hasSearched = true;
    component.errorMessage = 'Previous error';
    component.searchResults = [hotels[0]];

    component.resetSearch();
    fixture.detectChanges();

    expect(component.searchQuery).toBe('');
    expect(component.searchLocation).toBe('');
    expect(component.hasSearched).toBe(false);
    expect(component.errorMessage).toBe('');
    expect(component.searchResults).toEqual([]);
    expect(textContent()).toContain('Enter a hotel name or location to get started');
  });

  it('should render matching hotel cards after a search', () => {
    component.loadAllHotels = () => undefined;
    component.allHotels = hotels;
    component.searchQuery = 'city';
    component.searchLocation = 'new york';

    component.onSearch();
    fixture.detectChanges();

    expect(component.searchQuery).toBe('city');
    expect(component.searchLocation).toBe('new york');
    expect(component.searchResults).toEqual([hotels[1]]);
    expect(textContent()).toContain('Found 1 hotel(s)');
    expect(textContent()).toContain('City Suites');
    expect(textContent()).toContain('Downtown suites');
  });
});
