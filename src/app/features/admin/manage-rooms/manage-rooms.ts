import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Hotel } from '../../../models/hotel';
import { Room } from '../../../models/room';
import { HotelService } from '../../../services/hotel-service';
import { RoomPayload, RoomService } from '../../../services/room-service';

@Component({
  selector: 'app-manage-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-rooms.html',
  styleUrl: './manage-rooms.scss',
})
export class ManageRooms implements OnInit {
  hotels: Hotel[] = [];
  rooms: Room[] = [];
  selectedHotelId: number | null = null;
  editingRoomId: number | null = null;
  isLoadingHotels = false;
  isLoadingRooms = false;
  isSaving = false;
  isDeletingId: number | null = null;
  successMessage = '';
  errorMessage = '';
  roomTypes = ['SINGLE', 'DOUBLE', 'SUITE'];
  roomForm;

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private roomService: RoomService,
    private route: ActivatedRoute
  ) {
    this.roomForm = this.fb.group({
      hotelId: [null as number | null, [Validators.required]],
      roomNumber: [null as number | null, [Validators.required, Validators.min(1)]],
      type: ['SINGLE', [Validators.required]],
      price: [null as number | null, [Validators.required, Validators.min(0.01)]],
      available: [true],
      description: ['', [Validators.maxLength(1000)]],
    });
  }

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.isLoadingHotels = true;
    this.errorMessage = '';

    this.hotelService
      .getHotelsPage()
      .pipe(finalize(() => (this.isLoadingHotels = false)))
      .subscribe({
        next: (response) => {
          this.hotels = response.content || [];
          const requestedHotelId = Number(this.route.snapshot.queryParamMap.get('hotelId'));
          const initialHotel = this.hotels.find((hotel) => hotel.id === requestedHotelId) ?? this.hotels[0];
          if (!this.selectedHotelId && initialHotel) {
            this.selectHotel(initialHotel.id);
          }
        },
        error: () => {
          this.errorMessage = 'Failed to load hotels.';
        },
      });
  }

  selectHotel(hotelId: number): void {
    this.selectedHotelId = Number(hotelId);
    this.roomForm.patchValue({ hotelId: this.selectedHotelId });
    this.cancelEdit();
    this.loadRooms();
  }

  loadRooms(): void {
    if (!this.selectedHotelId) {
      this.rooms = [];
      return;
    }

    this.isLoadingRooms = true;
    this.errorMessage = '';

    this.roomService
      .getRoomsByHotel(this.selectedHotelId)
      .pipe(finalize(() => (this.isLoadingRooms = false)))
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms;
        },
        error: () => {
          this.errorMessage = 'Failed to load rooms.';
        },
      });
  }

  onSubmit(): void {
    if (this.roomForm.invalid || !this.selectedHotelId) {
      this.roomForm.markAllAsTouched();
      return;
    }

    const payload: RoomPayload = {
      hotelId: this.selectedHotelId,
      roomNumber: Number(this.roomForm.value.roomNumber),
      type: this.roomForm.value.type ?? 'SINGLE',
      price: Number(this.roomForm.value.price),
      available: Boolean(this.roomForm.value.available),
      description: this.roomForm.value.description?.trim() || '',
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ = this.editingRoomId
      ? this.roomService.updateRoom(this.editingRoomId, payload)
      : this.roomService.createRoom(payload);

    request$.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.successMessage = this.editingRoomId
          ? 'Room updated successfully.'
          : 'Room added successfully.';
        this.resetForm();
        this.loadRooms();
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (this.editingRoomId ? 'Failed to update room.' : 'Failed to add room.');
      },
    });
  }

  editRoom(room: Room): void {
    this.editingRoomId = room.id;
    this.successMessage = '';
    this.errorMessage = '';
    this.roomForm.setValue({
      hotelId: room.hotelId,
      roomNumber: room.roomNumber,
      type: room.type,
      price: room.price,
      available: room.available,
      description: room.description ?? '',
    });
  }

  deleteRoom(room: Room): void {
    this.isDeletingId = room.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.roomService
      .deleteRoom(room.id)
      .pipe(finalize(() => (this.isDeletingId = null)))
      .subscribe({
        next: () => {
          if (this.editingRoomId === room.id) {
            this.resetForm();
          }
          this.successMessage = 'Room deleted successfully.';
          this.loadRooms();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete room.';
        },
      });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingRoomId = null;
    this.roomForm.reset({
      hotelId: this.selectedHotelId,
      roomNumber: null,
      type: 'SINGLE',
      price: null,
      available: true,
      description: '',
    });
  }
}
