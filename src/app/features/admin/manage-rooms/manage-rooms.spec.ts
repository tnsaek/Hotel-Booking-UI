import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { Hotel } from '../../../models/hotel';
import { Room } from '../../../models/room';
import { HotelService, PagedResponse } from '../../../services/hotel-service';
import { RoomService } from '../../../services/room-service';
import { ManageRooms } from './manage-rooms';

type RoomFormValue = {
  hotelId: number | null;
  roomNumber: number | null;
  type: string | null;
  price: number | null;
  available: boolean | null;
  description: string | null;
};

describe('ManageRooms', () => {
  let component: ManageRooms;
  let fixture: ComponentFixture<ManageRooms>;
  let hotelServiceSpy: {
    getHotelsPage: ReturnType<typeof vi.fn>;
  };
  let roomServiceSpy: {
    getRoomsByHotel: ReturnType<typeof vi.fn>;
    createRoom: ReturnType<typeof vi.fn>;
    updateRoom: ReturnType<typeof vi.fn>;
    deleteRoom: ReturnType<typeof vi.fn>;
  };
  let routeHotelId: string | null;

  const hotel: Hotel = {
    id: 1,
    name: 'Harbor Grand',
    location: 'Boston',
    description: 'Waterfront rooms',
  };

  const secondHotel: Hotel = {
    id: 2,
    name: 'City Suites',
    location: 'New York',
    description: 'Downtown rooms',
  };

  const room: Room = {
    id: 3,
    hotelId: 1,
    roomNumber: 103,
    type: 'SUITE',
    price: 300,
    available: true,
    description: 'Corner suite',
  };

  const emptyPage: PagedResponse<Hotel> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 100,
    number: 0,
  };

  function page(content?: Hotel[]): PagedResponse<Hotel> {
    return {
      ...emptyPage,
      content: content as Hotel[],
      totalElements: content?.length ?? 0,
    };
  }

  beforeEach(async () => {
    routeHotelId = null;
    hotelServiceSpy = {
      getHotelsPage: vi.fn().mockReturnValue(of(emptyPage)),
    };
    roomServiceSpy = {
      getRoomsByHotel: vi.fn().mockReturnValue(of([])),
      createRoom: vi.fn(),
      updateRoom: vi.fn(),
      deleteRoom: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ManageRooms],
      providers: [
        { provide: HotelService, useValue: hotelServiceSpy },
        { provide: RoomService, useValue: roomServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => routeHotelId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageRooms);
    component = fixture.componentInstance;
  });

  function validRoomForm(overrides: Partial<RoomFormValue> = {}): RoomFormValue {
    return {
      hotelId: 1,
      roomNumber: 101,
      type: 'SINGLE',
      price: 100,
      available: true,
      description: '',
      ...overrides,
    };
  }

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function buttonWithText(label: string): HTMLButtonElement | undefined {
    return buttons().find((button) => button.textContent?.includes(label));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hotels on init and select the first hotel by default', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel, secondHotel])));

    component.ngOnInit();

    expect(hotelServiceSpy.getHotelsPage).toHaveBeenCalled();
    expect(component.hotels).toEqual([hotel, secondHotel]);
    expect(component.selectedHotelId).toBe(1);
    expect(component.roomForm.value.hotelId).toBe(1);
    expect(roomServiceSpy.getRoomsByHotel).toHaveBeenCalledWith(1);
    expect(component.isLoadingHotels).toBe(false);
  });

  it('should select the requested hotel from query params', () => {
    routeHotelId = '2';
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel, secondHotel])));

    component.loadHotels();

    expect(component.selectedHotelId).toBe(2);
    expect(roomServiceSpy.getRoomsByHotel).toHaveBeenCalledWith(2);
  });

  it('should default missing hotel page content to an empty list', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page(undefined)));

    component.loadHotels();

    expect(component.hotels).toEqual([]);
    expect(component.selectedHotelId).toBeNull();
    expect(component.isLoadingHotels).toBe(false);
  });

  it('should handle error when loading hotels', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(throwError(() => ({})));

    component.loadHotels();

    expect(component.errorMessage).toBe('Failed to load hotels.');
    expect(component.isLoadingHotels).toBe(false);
  });

  it('should select hotel, reset edit state, and load rooms', () => {
    component.editingRoomId = 9;
    component.roomForm.setValue(validRoomForm({ roomNumber: 202, price: 250 }));

    component.selectHotel(2);

    expect(component.selectedHotelId).toBe(2);
    expect(component.editingRoomId).toBeNull();
    expect(component.roomForm.value).toEqual({
      hotelId: 2,
      roomNumber: null,
      type: 'SINGLE',
      price: null,
      available: true,
      description: '',
    });
    expect(roomServiceSpy.getRoomsByHotel).toHaveBeenCalledWith(2);
  });

  it('should clear rooms when no hotel is selected', () => {
    component.rooms = [room];
    component.selectedHotelId = null;

    component.loadRooms();

    expect(component.rooms).toEqual([]);
    expect(roomServiceSpy.getRoomsByHotel).not.toHaveBeenCalled();
  });

  it('should load rooms for selected hotel', () => {
    component.selectedHotelId = 1;
    roomServiceSpy.getRoomsByHotel.mockReturnValue(of([room]));

    component.loadRooms();

    expect(roomServiceSpy.getRoomsByHotel).toHaveBeenCalledWith(1);
    expect(component.rooms).toEqual([room]);
    expect(component.isLoadingRooms).toBe(false);
  });

  it('should handle error when loading rooms', () => {
    component.selectedHotelId = 1;
    roomServiceSpy.getRoomsByHotel.mockReturnValue(throwError(() => ({})));

    component.loadRooms();

    expect(component.errorMessage).toBe('Failed to load rooms.');
    expect(component.isLoadingRooms).toBe(false);
  });

  it('should not submit if form is invalid or no hotel selected', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.roomForm, 'markAllAsTouched');
    component.roomForm.setValue({
      hotelId: null,
      roomNumber: null,
      type: 'SINGLE',
      price: null,
      available: true,
      description: '',
    });
    component.selectedHotelId = null;

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(roomServiceSpy.createRoom).not.toHaveBeenCalled();
    expect(roomServiceSpy.updateRoom).not.toHaveBeenCalled();
  });

  it('should create room on submit', () => {
    roomServiceSpy.createRoom.mockReturnValue(of(room));
    const loadRoomsSpy = vi.spyOn(component, 'loadRooms');
    component.selectedHotelId = 1;
    component.roomForm.setValue(validRoomForm({ description: ' balcony ' }));

    component.onSubmit();

    expect(roomServiceSpy.createRoom).toHaveBeenCalledWith({
      hotelId: 1,
      roomNumber: 101,
      type: 'SINGLE',
      price: 100,
      available: true,
      description: 'balcony',
    });
    expect(component.successMessage).toBe('Room added successfully.');
    expect(component.editingRoomId).toBeNull();
    expect(component.roomForm.value).toEqual({
      hotelId: 1,
      roomNumber: null,
      type: 'SINGLE',
      price: null,
      available: true,
      description: '',
    });
    expect(component.isSaving).toBe(false);
    expect(loadRoomsSpy).toHaveBeenCalled();
  });

  it('should update room on submit', () => {
    roomServiceSpy.updateRoom.mockReturnValue(of(room));
    const loadRoomsSpy = vi.spyOn(component, 'loadRooms');
    component.selectedHotelId = 1;
    component.editingRoomId = 2;
    component.roomForm.setValue(validRoomForm({
      roomNumber: 102,
      type: 'DOUBLE',
      price: 200,
      available: false,
      description: ' city view ',
    }));

    component.onSubmit();

    expect(roomServiceSpy.updateRoom).toHaveBeenCalledWith(2, {
      hotelId: 1,
      roomNumber: 102,
      type: 'DOUBLE',
      price: 200,
      available: false,
      description: 'city view',
    });
    expect(component.successMessage).toBe('Room updated successfully.');
    expect(component.editingRoomId).toBeNull();
    expect(component.isSaving).toBe(false);
    expect(loadRoomsSpy).toHaveBeenCalled();
  });

  it('should default missing room type to single when submitting', () => {
    roomServiceSpy.createRoom.mockReturnValue(of(room));
    component.selectedHotelId = 1;
    component.roomForm.controls.type.clearValidators();
    component.roomForm.controls.type.updateValueAndValidity();
    component.roomForm.setValue(validRoomForm({ type: null }));

    component.onSubmit();

    expect(roomServiceSpy.createRoom).toHaveBeenCalledWith({
      hotelId: 1,
      roomNumber: 101,
      type: 'SINGLE',
      price: 100,
      available: true,
      description: '',
    });
  });

  it('should handle a custom create room error', () => {
    roomServiceSpy.createRoom.mockReturnValue(
      throwError(() => ({ error: { message: 'Create failed' } }))
    );
    component.selectedHotelId = 1;
    component.roomForm.setValue(validRoomForm());

    component.onSubmit();

    expect(component.errorMessage).toBe('Create failed');
    expect(component.isSaving).toBe(false);
  });

  it('should handle a default create room error', () => {
    roomServiceSpy.createRoom.mockReturnValue(throwError(() => ({})));
    component.selectedHotelId = 1;
    component.roomForm.setValue(validRoomForm());

    component.onSubmit();

    expect(component.errorMessage).toBe('Failed to add room.');
    expect(component.isSaving).toBe(false);
  });

  it('should handle a custom update room error', () => {
    roomServiceSpy.updateRoom.mockReturnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    component.selectedHotelId = 1;
    component.editingRoomId = 2;
    component.roomForm.setValue(validRoomForm());

    component.onSubmit();

    expect(component.errorMessage).toBe('Update failed');
    expect(component.isSaving).toBe(false);
  });

  it('should handle a default update room error', () => {
    roomServiceSpy.updateRoom.mockReturnValue(throwError(() => ({})));
    component.selectedHotelId = 1;
    component.editingRoomId = 2;
    component.roomForm.setValue(validRoomForm());

    component.onSubmit();

    expect(component.errorMessage).toBe('Failed to update room.');
    expect(component.isSaving).toBe(false);
  });

  it('should edit room and default missing description to an empty string', () => {
    component.successMessage = 'Saved';
    component.errorMessage = 'Failed';

    component.editRoom({ ...room, description: undefined });

    expect(component.editingRoomId).toBe(3);
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.roomForm.value).toEqual({
      hotelId: 1,
      roomNumber: 103,
      type: 'SUITE',
      price: 300,
      available: true,
      description: '',
    });
  });

  it('should delete room and reset the form when deleting the edited room', () => {
    roomServiceSpy.deleteRoom.mockReturnValue(of(undefined));
    const loadRoomsSpy = vi.spyOn(component, 'loadRooms');
    component.selectedHotelId = 1;
    component.editingRoomId = 3;
    component.roomForm.setValue(validRoomForm({ roomNumber: 103 }));

    component.deleteRoom(room);

    expect(roomServiceSpy.deleteRoom).toHaveBeenCalledWith(3);
    expect(component.successMessage).toBe('Room deleted successfully.');
    expect(component.editingRoomId).toBeNull();
    expect(component.roomForm.value).toEqual({
      hotelId: 1,
      roomNumber: null,
      type: 'SINGLE',
      price: null,
      available: true,
      description: '',
    });
    expect(component.isDeletingId).toBeNull();
    expect(loadRoomsSpy).toHaveBeenCalled();
  });

  it('should delete room without resetting the form when deleting another room', () => {
    roomServiceSpy.deleteRoom.mockReturnValue(of(undefined));
    component.selectedHotelId = 1;
    component.editingRoomId = 99;
    component.roomForm.setValue(validRoomForm({ roomNumber: 103 }));

    component.deleteRoom(room);

    expect(component.successMessage).toBe('Room deleted successfully.');
    expect(component.editingRoomId).toBe(99);
    expect(component.roomForm.value.roomNumber).toBe(103);
    expect(component.isDeletingId).toBeNull();
  });

  it('should handle a custom delete room error', () => {
    roomServiceSpy.deleteRoom.mockReturnValue(
      throwError(() => ({ error: { message: 'Delete failed' } }))
    );

    component.deleteRoom(room);

    expect(component.errorMessage).toBe('Delete failed');
    expect(component.isDeletingId).toBeNull();
  });

  it('should handle a default delete room error', () => {
    roomServiceSpy.deleteRoom.mockReturnValue(throwError(() => ({})));

    component.deleteRoom(room);

    expect(component.errorMessage).toBe('Failed to delete room.');
    expect(component.isDeletingId).toBeNull();
  });

  it('should cancel edit and reset the form', () => {
    component.selectedHotelId = 1;
    component.editingRoomId = 6;
    component.roomForm.setValue(validRoomForm({
      roomNumber: 106,
      price: 600,
      available: false,
      description: 'desc',
    }));

    component.cancelEdit();

    expect(component.editingRoomId).toBeNull();
    expect(component.roomForm.value).toEqual({
      hotelId: 1,
      roomNumber: null,
      type: 'SINGLE',
      price: null,
      available: true,
      description: '',
    });
  });

  it('should render selector, add mode, messages, empty state, and loading states', () => {
    const hotels$ = new Subject<PagedResponse<Hotel>>();
    hotelServiceSpy.getHotelsPage.mockReturnValue(hotels$);
    component.successMessage = 'Saved';

    fixture.detectChanges(false);

    let pageText = textContent();
    expect(pageText).toContain('Manage Rooms');
    expect(pageText).toContain('Add Room');
    expect(pageText).toContain('Saved');
    expect(buttonWithText('Refresh')?.disabled).toBe(true);
    const selector = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(selector.disabled).toBe(true);

    component.errorMessage = 'Load failed';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges(false);
    expect(textContent()).toContain('Load failed');

    hotels$.next(page([hotel, secondHotel]));
    hotels$.complete();
    fixture.detectChanges(false);

    pageText = textContent();
    expect(pageText).toContain('Harbor Grand - Boston');
    expect(pageText).toContain('City Suites - New York');
    expect(pageText).toContain('No rooms found for this hotel.');
  });

  it('should render room cards and invoke selector, refresh, edit, and delete from template', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel, secondHotel])));
    roomServiceSpy.getRoomsByHotel.mockReturnValue(of([
      room,
      { ...room, id: 4, roomNumber: 104, available: false, description: '' },
    ]));
    roomServiceSpy.deleteRoom.mockReturnValue(of(undefined));
    const selectHotelSpy = vi.spyOn(component, 'selectHotel');
    const loadRoomsSpy = vi.spyOn(component, 'loadRooms');
    const editRoomSpy = vi.spyOn(component, 'editRoom');
    const deleteRoomSpy = vi.spyOn(component, 'deleteRoom');

    fixture.detectChanges(false);

    const selector = fixture.nativeElement.querySelector('.hotel-selector select') as HTMLSelectElement;
    selector.value = '2';
    selector.dispatchEvent(new Event('change'));

    const pageText = textContent();
    expect(pageText).toContain('Room 103');
    expect(pageText).toContain('SUITE');
    expect(pageText).toContain('$300 per night');
    expect(pageText).toContain('Corner suite');
    expect(pageText).toContain('Available');
    expect(pageText).toContain('Room 104');
    expect(pageText).toContain('No description provided.');
    expect(pageText).toContain('Unavailable');

    buttonWithText('Refresh')?.click();
    buttonWithText('Edit')?.click();
    buttonWithText('Delete')?.click();

    expect(selectHotelSpy).toHaveBeenCalledWith(2);
    expect(loadRoomsSpy).toHaveBeenCalled();
    expect(editRoomSpy).toHaveBeenCalledWith(room);
    expect(deleteRoomSpy).toHaveBeenCalledWith(room);
  });

  it('should render update mode and invoke cancel from template', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    roomServiceSpy.getRoomsByHotel.mockReturnValue(of([room]));
    component.selectedHotelId = 1;
    component.editingRoomId = 3;
    component.roomForm.setValue(validRoomForm({
      hotelId: 1,
      roomNumber: 103,
      type: 'SUITE',
      price: 300,
      description: 'Corner suite',
    }));
    const cancelEditSpy = vi.spyOn(component, 'cancelEdit');

    fixture.detectChanges(false);

    expect(textContent()).toContain('Update Room');
    buttonWithText('Cancel')?.click();

    expect(cancelEditSpy).toHaveBeenCalled();
  });

  it('should render saving, refreshing, and deleting disabled states', () => {
    const rooms$ = new Subject<Room[]>();
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    roomServiceSpy.getRoomsByHotel.mockReturnValue(rooms$);
    component.isSaving = true;
    component.isDeletingId = 3;

    fixture.detectChanges(false);

    expect(buttonWithText('Saving...')?.disabled).toBe(true);
    expect(buttonWithText('Refreshing...')?.disabled).toBe(true);

    fixture = TestBed.createComponent(ManageRooms);
    component = fixture.componentInstance;
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    roomServiceSpy.getRoomsByHotel.mockReturnValue(of([room]));
    component.isDeletingId = 3;
    fixture.detectChanges(false);

    expect(buttonWithText('Deleting...')?.disabled).toBe(true);
  });

  it('should submit the reactive form from the template', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    roomServiceSpy.createRoom.mockReturnValue(of(room));
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');

    fixture.detectChanges(false);
    component.selectedHotelId = 1;
    component.roomForm.setValue(validRoomForm());
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));

    expect(onSubmitSpy).toHaveBeenCalled();
  });
});
