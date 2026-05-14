import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { HotelService } from '../../../services/hotel-service';
import { Hotel } from '../../../models/hotel';

@Component({
  selector: 'app-hotel-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hotel-search.html',
  styleUrl: './hotel-search.scss',
})
export class HotelSearch implements OnInit {
  private hotelService = inject(HotelService);

  searchQuery: string = '';
  searchLocation: string = '';
  allHotels: Hotel[] = [];
  searchResults: Hotel[] = [];
  isLoadingHotels: boolean = false;
  isSearching: boolean = false;
  hasSearched: boolean = false;
  errorMessage: string = '';

  ngOnInit(): void {
    this.loadAllHotels();
  }

  loadAllHotels(): void {
    this.isLoadingHotels = true;
    this.errorMessage = '';
    this.hasSearched = false;
    this.hotelService
      .getHotels()
      .pipe(finalize(() => (this.isLoadingHotels = false)))
      .subscribe({
        next: (hotels) => {
          this.allHotels = hotels;
          this.searchResults = [];
        },
        error: () => {
          this.allHotels = [];
          this.searchResults = [];
          this.errorMessage = 'Failed to load hotels. Check that the backend is running on http://localhost:8080.';
        },
      });
  }

  onSearch(): void {
    this.errorMessage = '';
    this.hasSearched = true;

    const query = this.searchQuery.trim().toLowerCase();
    const location = this.searchLocation.trim().toLowerCase();

    this.searchResults = this.allHotels.filter((hotel) => {
      const matchesName = !query || hotel.name.toLowerCase().includes(query);
      const matchesLocation = !location || hotel.location.toLowerCase().includes(location);
      return matchesName && matchesLocation;
    });
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.searchLocation = '';
    this.hasSearched = false;
    this.errorMessage = '';
    this.searchResults = [];
  }
}
