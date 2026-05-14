import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Hotel } from '../../../models/hotel';
import { HotelService } from '../../../services/hotel-service';

@Component({
  selector: 'app-manage-hotels',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './manage-hotels.html',
  styleUrl: './manage-hotels.scss',
})
export class ManageHotels implements OnInit {
  hotels: Hotel[] = [];
  isLoading = false;
  isSaving = false;
  isDeletingId: number | null = null;
  editingHotelId: number | null = null;
  successMessage = '';
  errorMessage = '';
  hotelForm;

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService
  ) {
    this.hotelForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      location: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
    });
  }

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.hotelService
      .getHotelsPage()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.hotels = response.content || [];
        },
        error: () => {
          this.errorMessage = 'Failed to load hotels.';
        },
      });
  }

  onSubmit(): void {
    if (this.hotelForm.invalid) {
      this.hotelForm.markAllAsTouched();
      return;
    }

    const payload = {
      name: this.hotelForm.value.name?.trim() ?? '',
      location: this.hotelForm.value.location?.trim() ?? '',
      description: this.hotelForm.value.description?.trim() ?? '',
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.editingHotelId
      ? this.hotelService.updateHotel(this.editingHotelId, payload)
      : this.hotelService.createHotel(payload);

    request$.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingHotelId
          ? 'Hotel updated successfully.'
          : 'Hotel created successfully.';
        this.resetForm();
        this.loadHotels();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (this.editingHotelId ? 'Failed to update hotel.' : 'Failed to create hotel.');
      },
    });
  }

  editHotel(hotel: Hotel): void {
    this.editingHotelId = hotel.id;
    this.successMessage = '';
    this.errorMessage = '';
    this.hotelForm.setValue({
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
    });
  }

  deleteHotel(hotel: Hotel): void {
    this.isDeletingId = hotel.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.hotelService
      .deleteHotel(hotel.id)
      .pipe(finalize(() => (this.isDeletingId = null)))
      .subscribe({
        next: () => {
          if (this.editingHotelId === hotel.id) {
            this.resetForm();
          }
          this.successMessage = 'Hotel deleted successfully.';
          this.loadHotels();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete hotel.';
        },
      });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingHotelId = null;
    this.hotelForm.reset({
      name: '',
      location: '',
      description: '',
    });
  }
}
