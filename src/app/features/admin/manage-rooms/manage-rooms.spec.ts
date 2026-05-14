import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRooms } from './manage-rooms';

describe('ManageRooms', () => {
  let component: ManageRooms;
  let fixture: ComponentFixture<ManageRooms>;
  let hotelServiceSpy: jasmine.SpyObj<any>;
  let roomServiceSpy: jasmine.SpyObj<any>;
  let routeStub: any;

  beforeEach(async () => {
    hotelServiceSpy = jasmine.createSpyObj('HotelService', ['getHotelsPage']);
    roomServiceSpy = jasmine.createSpyObj('RoomService', ['getRoomsByHotel', 'createRoom', 'updateRoom', 'deleteRoom']);
    routeStub = { snapshot: { queryParamMap: { get: () => null } } };
    await TestBed.configureTestingModule({
      imports: [ManageRooms],
      providers: [
        { provide: 'HotelService', useValue: hotelServiceSpy },
        { provide: 'RoomService', useValue: roomServiceSpy },
        { provide: 'ActivatedRoute', useValue: routeStub },
      ],
    }).overrideComponent(ManageRooms, {
      set: {
        providers: [
          { provide: 'HotelService', useValue: hotelServiceSpy },
          { provide: 'RoomService', useValue: roomServiceSpy },
          { provide: 'ActivatedRoute', useValue: routeStub },
        ],
      },
    }).compileComponents();
    fixture = TestBed.createComponent(ManageRooms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hotels on init', () => {
    const hotels = [{ id: 1, name: 'Hotel', location: 'Loc', description: 'Desc' }];
    hotelServiceSpy.getHotelsPage.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({ content: hotels }) }) });
    spyOn(component, 'selectHotel');
    component.ngOnInit();
    expect(hotelServiceSpy.getHotelsPage).toHaveBeenCalled();
  });

  it('should handle error when loading hotels', () => {
    hotelServiceSpy.getHotelsPage.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({}) }) });
    component.loadHotels();
    expect(component.errorMessage).toBe('Failed to load hotels.');
  });

  it('should select hotel and load rooms', () => {
    spyOn(component, 'cancelEdit');
    spyOn(component, 'loadRooms');
    component.selectHotel(2);
    expect(component.selectedHotelId).toBe(2);
    expect(component.cancelEdit).toHaveBeenCalled();
    expect(component.loadRooms).toHaveBeenCalled();
  });

  it('should load rooms for selected hotel', () => {
    component.selectedHotelId = 1;
    const rooms = [{ id: 1, hotelId: 1, roomNumber: 101, type: 'SINGLE', price: 100, available: true, description: '' }];
    roomServiceSpy.getRoomsByHotel.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next(rooms) }) });
    component.loadRooms();
    expect(roomServiceSpy.getRoomsByHotel).toHaveBeenCalledWith(1);
    expect(component.rooms).toEqual(rooms);
  });

  it('should handle error when loading rooms', () => {
    component.selectedHotelId = 1;
    roomServiceSpy.getRoomsByHotel.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({}) }) });
    component.loadRooms();
    expect(component.errorMessage).toBe('Failed to load rooms.');
  });

  it('should not submit if form is invalid or no hotel selected', () => {
    spyOn(component.roomForm, 'markAllAsTouched');
    component.roomForm.setValue({ hotelId: null, roomNumber: null, type: 'SINGLE', price: null, available: true, description: '' });
    component.selectedHotelId = null;
    component.onSubmit();
    expect(component.roomForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should create room on submit', () => {
    component.selectedHotelId = 1;
    component.roomForm.setValue({ hotelId: 1, roomNumber: 101, type: 'SINGLE', price: 100, available: true, description: '' });
    roomServiceSpy.createRoom.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({}) }) });
    spyOn(component, 'resetForm');
    spyOn(component, 'loadRooms');
    component.onSubmit();
    expect(roomServiceSpy.createRoom).toHaveBeenCalled();
    expect(component.successMessage).toBe('Room added successfully.');
    expect(component.resetForm).toHaveBeenCalled();
    expect(component.loadRooms).toHaveBeenCalled();
  });

  it('should update room on submit', () => {
    component.selectedHotelId = 1;
    component.editingRoomId = 2;
    component.roomForm.setValue({ hotelId: 1, roomNumber: 102, type: 'DOUBLE', price: 200, available: false, description: 'desc' });
    roomServiceSpy.updateRoom.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({}) }) });
    spyOn(component, 'resetForm');
    spyOn(component, 'loadRooms');
    component.onSubmit();
    expect(roomServiceSpy.updateRoom).toHaveBeenCalledWith(2, jasmine.any(Object));
    expect(component.successMessage).toBe('Room updated successfully.');
    expect(component.resetForm).toHaveBeenCalled();
    expect(component.loadRooms).toHaveBeenCalled();
  });

  it('should handle error on create room', () => {
    component.selectedHotelId = 1;
    component.roomForm.setValue({ hotelId: 1, roomNumber: 101, type: 'SINGLE', price: 100, available: true, description: '' });
    roomServiceSpy.createRoom.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should handle error on update room', () => {
    component.selectedHotelId = 1;
    component.editingRoomId = 2;
    component.roomForm.setValue({ hotelId: 1, roomNumber: 102, type: 'DOUBLE', price: 200, available: false, description: 'desc' });
    roomServiceSpy.updateRoom.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should edit room', () => {
    const room = { id: 3, hotelId: 1, roomNumber: 103, type: 'SUITE', price: 300, available: true, description: 'desc' };
    component.editRoom(room as any);
    expect(component.editingRoomId).toBe(3);
    expect(component.roomForm.value).toEqual({ hotelId: 1, roomNumber: 103, type: 'SUITE', price: 300, available: true, description: 'desc' });
  });

  it('should delete room', () => {
    const room = { id: 4, hotelId: 1, roomNumber: 104, type: 'SINGLE', price: 400, available: false, description: '' };
    roomServiceSpy.deleteRoom.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({}) }) });
    spyOn(component, 'resetForm');
    spyOn(component, 'loadRooms');
    component.editingRoomId = 4;
    component.deleteRoom(room as any);
    expect(roomServiceSpy.deleteRoom).toHaveBeenCalledWith(4);
    expect(component.successMessage).toBe('Room deleted successfully.');
    expect(component.resetForm).toHaveBeenCalled();
    expect(component.loadRooms).toHaveBeenCalled();
  });

  it('should handle error on delete room', () => {
    const room = { id: 5, hotelId: 1, roomNumber: 105, type: 'DOUBLE', price: 500, available: true, description: '' };
    roomServiceSpy.deleteRoom.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) });
    component.deleteRoom(room as any);
    expect(component.errorMessage).toBe('fail');
  });

  it('should cancel edit', () => {
    spyOn(component as any, 'resetForm');
    component.cancelEdit();
    expect((component as any).resetForm).toHaveBeenCalled();
  });

  it('should reset form', () => {
    component.selectedHotelId = 1;
    component.editingRoomId = 6;
    component.roomForm.setValue({ hotelId: 1, roomNumber: 106, type: 'SINGLE', price: 600, available: false, description: 'desc' });
    component['resetForm']();
    expect(component.editingRoomId).toBeNull();
    expect(component.roomForm.value).toEqual({ hotelId: 1, roomNumber: null, type: 'SINGLE', price: null, available: true, description: '' });
  });
});
