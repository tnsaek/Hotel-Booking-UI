import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HotelService } from '../../../services/hotel-service';
import { ExternalHotelOffer } from '../../../models/external-hotel-offer';

@Component({
  selector: 'app-hotel-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hotel-search.html',
  styleUrl: './hotel-search.scss',
})
export class HotelSearch implements OnInit {
  private hotelService = inject(HotelService);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  private searchRequestId = 0;

  cityName: string = '';
  countryCode: string = 'US';
  checkInDate: string = '';
  checkOutDate: string = '';
  adults: number = 1;
  roomQuantity: number = 1;
  currency: string = 'USD';
  guestNationality: string = 'US';
  searchResults: ExternalHotelOffer[] = [];
  isLoadingHotels: boolean = false;
  isSearching: boolean = false;
  hasSearched: boolean = false;
  errorMessage: string = '';
  bookingHotelId: string = '';

  ngOnInit(): void {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);

    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);

    this.checkInDate = this.toDateInputValue(checkIn);
    this.checkOutDate = this.toDateInputValue(checkOut);
  }

  loadAllHotels(): void {
    this.onSearch();
  }

  async onSearch(): Promise<void> {
    this.errorMessage = '';
    this.hasSearched = true;
    this.searchResults = [];

    const cityName = this.cityName.trim();
    const countryCode = this.countryCode.trim().toUpperCase();
    if (!cityName) {
      this.errorMessage = 'Enter a city name.';
      return;
    }
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      this.errorMessage = 'Enter a 2-letter country code, for example US or FR.';
      return;
    }

    this.cityName = cityName;
    this.countryCode = countryCode;
    this.isSearching = true;
    const requestId = ++this.searchRequestId;

    try {
      const hotels = await this.withSearchTimeout(
        firstValueFrom(
          this.hotelService.searchLiteApiHotels({
            cityName,
            countryCode,
            checkInDate: this.checkInDate,
            checkOutDate: this.checkOutDate,
            adults: this.adults,
            roomQuantity: this.roomQuantity,
            currency: this.currency.trim().toUpperCase() || 'USD',
            guestNationality: this.guestNationality.trim().toUpperCase() || 'US',
          })
        ),
        12000
      );

      if (requestId === this.searchRequestId) {
        this.searchResults = hotels;
      }
    } catch (error) {
      if (requestId === this.searchRequestId) {
        this.errorMessage =
          error instanceof Error && error.message === 'search-timeout'
            ? 'Search timed out. Check that the backend is running and LiteAPI is reachable.'
            : 'Failed to search LiteAPI hotels. Check backend LiteAPI key and search criteria.';
      }
    } finally {
      if (requestId === this.searchRequestId) {
        this.isSearching = false;
        this.changeDetector.detectChanges();
      }
    }
  }

  resetSearch(): void {
    this.searchRequestId++;
    this.cityName = '';
    this.countryCode = 'US';
    this.adults = 1;
    this.roomQuantity = 1;
    this.currency = 'USD';
    this.guestNationality = 'US';
    this.hasSearched = false;
    this.errorMessage = '';
    this.searchResults = [];
    this.bookingHotelId = '';
  }

  bookHotel(hotel: ExternalHotelOffer): void {
    this.errorMessage = '';
    this.bookingHotelId = hotel.hotelId;

    this.hotelService.createLiteApiBookableRoom(hotel).subscribe({
      next: (room) => {
        this.bookingHotelId = '';
        this.router.navigate(['/booking', room.id], {
          queryParams: {
            checkIn: hotel.checkInDate,
            checkOut: hotel.checkOutDate,
          },
        });
      },
      error: () => {
        this.bookingHotelId = '';
        this.errorMessage = 'Unable to prepare this LiteAPI hotel for booking. Please try another hotel.';
      },
    });
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private withSearchTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error('search-timeout')), timeoutMs);
      }),
    ]);
  }
}
