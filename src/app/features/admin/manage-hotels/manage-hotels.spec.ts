import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ManageHotels } from './manage-hotels';
import { HotelService } from '../../../services/hotel-service';

describe('ManageHotels', () => {
  let component: ManageHotels;
  let fixture: ComponentFixture<ManageHotels>;
  let hotelServiceSpy: jasmine.SpyObj<HotelService>;

  beforeEach(async () => {
    hotelServiceSpy = jasmine.createSpyObj('HotelService', [
      'getHotelsPage', 'createHotel', 'updateHotel', 'deleteHotel'
    ]);
    await TestBed.configureTestingModule({
      imports: [ManageHotels],
      providers: [
        { provide: HotelService, useValue: hotelServiceSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ManageHotels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hotels on init', () => {
    const hotels = [{ id: 1, name: 'Hotel', location: 'Loc', description: 'Desc' }];
    hotelServiceSpy.getHotelsPage.and.returnValue(of({ content: hotels }));
    component.ngOnInit();
    expect(hotelServiceSpy.getHotelsPage).toHaveBeenCalled();
    expect(component.hotels).toEqual(hotels);
  });

  it('should handle error when loading hotels', () => {
    hotelServiceSpy.getHotelsPage.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({}) }) } as any);
    component.loadHotels();
    expect(component.errorMessage).toBe('Failed to load hotels.');
  });

  it('should not submit if form is invalid', () => {
    spyOn(component.hotelForm, 'markAllAsTouched');
    component.hotelForm.setValue({ name: '', location: '', description: '' });
    component.onSubmit();
    expect(component.hotelForm.markAllAsTouched).toHaveBeenCalled();
  });

  it('should create hotel on submit', () => {
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });
    hotelServiceSpy.createHotel.and.returnValue(of({}));
    spyOn(component, 'resetForm');
    spyOn(component, 'loadHotels');
    component.onSubmit();
    expect(hotelServiceSpy.createHotel).toHaveBeenCalled();
    expect(component.successMessage).toBe('Hotel created successfully.');
    expect(component.resetForm).toHaveBeenCalled();
    expect(component.loadHotels).toHaveBeenCalled();
  });

  it('should update hotel on submit', () => {
    component.editingHotelId = 1;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });
    hotelServiceSpy.updateHotel.and.returnValue(of({}));
    spyOn(component, 'resetForm');
    spyOn(component, 'loadHotels');
    component.onSubmit();
    expect(hotelServiceSpy.updateHotel).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(component.successMessage).toBe('Hotel updated successfully.');
    expect(component.resetForm).toHaveBeenCalled();
    expect(component.loadHotels).toHaveBeenCalled();
  });

  it('should handle error on create hotel', () => {
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });
    hotelServiceSpy.createHotel.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) } as any);
    component.onSubmit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should handle error on update hotel', () => {
    component.editingHotelId = 1;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });
    hotelServiceSpy.updateHotel.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) } as any);
    component.onSubmit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should edit hotel', () => {
    const hotel = { id: 2, name: 'N', location: 'L', description: 'D' };
    component.editHotel(hotel as any);
    expect(component.editingHotelId).toBe(2);
    expect(component.hotelForm.value).toEqual({ name: 'N', location: 'L', description: 'D' });
  });

  it('should delete hotel', () => {
    const hotel = { id: 3, name: 'N', location: 'L', description: 'D' };
    hotelServiceSpy.deleteHotel.and.returnValue(of({}));
    spyOn(component, 'resetForm');
    spyOn(component, 'loadHotels');
    component.editingHotelId = 3;
    component.deleteHotel(hotel as any);
    expect(hotelServiceSpy.deleteHotel).toHaveBeenCalledWith(3);
    expect(component.successMessage).toBe('Hotel deleted successfully.');
    expect(component.resetForm).toHaveBeenCalled();
    expect(component.loadHotels).toHaveBeenCalled();
  });

  it('should handle error on delete hotel', () => {
    const hotel = { id: 4, name: 'N', location: 'L', description: 'D' };
    hotelServiceSpy.deleteHotel.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) } as any);
    component.deleteHotel(hotel as any);
    expect(component.errorMessage).toBe('fail');
  });

  it('should cancel edit', () => {
    spyOn(component as any, 'resetForm');
    component.cancelEdit();
    expect((component as any).resetForm).toHaveBeenCalled();
  });

  it('should reset form', () => {
    component.editingHotelId = 5;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });
    component['resetForm']();
    expect(component.editingHotelId).toBeNull();
    expect(component.hotelForm.value).toEqual({ name: '', location: '', description: '' });
  });
});
