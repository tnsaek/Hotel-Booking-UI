import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { Hotel } from '../../../models/hotel';
import { HotelService, PagedResponse } from '../../../services/hotel-service';
import { ManageHotels } from './manage-hotels';

describe('ManageHotels', () => {
  let component: ManageHotels;
  let fixture: ComponentFixture<ManageHotels>;
  let hotelServiceSpy: {
    getHotelsPage: ReturnType<typeof vi.fn>;
    createHotel: ReturnType<typeof vi.fn>;
    updateHotel: ReturnType<typeof vi.fn>;
    deleteHotel: ReturnType<typeof vi.fn>;
  };

  const hotel: Hotel = {
    id: 1,
    name: 'Harbor Grand',
    location: 'Boston',
    description: 'Waterfront rooms',
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

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  function buttonWithText(label: string): HTMLButtonElement | undefined {
    return buttons().find((button) => button.textContent?.includes(label));
  }

  beforeEach(async () => {
    hotelServiceSpy = {
      getHotelsPage: vi.fn().mockReturnValue(of(emptyPage)),
      createHotel: vi.fn(),
      updateHotel: vi.fn(),
      deleteHotel: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ManageHotels],
      providers: [
        provideRouter([]),
        { provide: HotelService, useValue: hotelServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageHotels);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hotels on init', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));

    component.ngOnInit();

    expect(hotelServiceSpy.getHotelsPage).toHaveBeenCalled();
    expect(component.hotels).toEqual([hotel]);
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should default missing page content to an empty list', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page(undefined)));

    component.loadHotels();

    expect(component.hotels).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should handle error when loading hotels', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(throwError(() => ({})));

    component.loadHotels();

    expect(component.errorMessage).toBe('Failed to load hotels.');
    expect(component.isLoading).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.hotelForm, 'markAllAsTouched');
    component.hotelForm.setValue({ name: '', location: '', description: '' });

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(hotelServiceSpy.createHotel).not.toHaveBeenCalled();
    expect(hotelServiceSpy.updateHotel).not.toHaveBeenCalled();
  });

  it('should create hotel on submit', () => {
    hotelServiceSpy.createHotel.mockReturnValue(of(hotel));
    const loadHotelsSpy = vi.spyOn(component, 'loadHotels');
    component.hotelForm.setValue({ name: ' A ', location: ' B ', description: ' C ' });

    component.onSubmit();

    expect(hotelServiceSpy.createHotel).toHaveBeenCalledWith({
      name: 'A',
      location: 'B',
      description: 'C',
    });
    expect(component.successMessage).toBe('Hotel created successfully.');
    expect(component.editingHotelId).toBeNull();
    expect(component.hotelForm.value).toEqual({ name: '', location: '', description: '' });
    expect(component.isSaving).toBe(false);
    expect(loadHotelsSpy).toHaveBeenCalled();
  });

  it('should update hotel on submit', () => {
    hotelServiceSpy.updateHotel.mockReturnValue(of(hotel));
    const loadHotelsSpy = vi.spyOn(component, 'loadHotels');
    component.editingHotelId = 1;
    component.hotelForm.setValue({ name: ' A ', location: ' B ', description: ' C ' });

    component.onSubmit();

    expect(hotelServiceSpy.updateHotel).toHaveBeenCalledWith(1, {
      name: 'A',
      location: 'B',
      description: 'C',
    });
    expect(component.successMessage).toBe('Hotel updated successfully.');
    expect(component.editingHotelId).toBeNull();
    expect(component.hotelForm.value).toEqual({ name: '', location: '', description: '' });
    expect(component.isSaving).toBe(false);
    expect(loadHotelsSpy).toHaveBeenCalled();
  });

  it('should submit empty strings when valid form values are nullish', () => {
    hotelServiceSpy.createHotel.mockReturnValue(of(hotel));
    Object.values(component.hotelForm.controls).forEach((control) => {
      control.clearValidators();
      control.updateValueAndValidity();
    });
    component.hotelForm.setValue({
      name: null as unknown as string,
      location: null as unknown as string,
      description: null as unknown as string,
    });

    component.onSubmit();

    expect(hotelServiceSpy.createHotel).toHaveBeenCalledWith({
      name: '',
      location: '',
      description: '',
    });
  });

  it('should handle a custom create hotel error', () => {
    hotelServiceSpy.createHotel.mockReturnValue(
      throwError(() => ({ error: { message: 'Create failed' } }))
    );
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Create failed');
    expect(component.isSaving).toBe(false);
  });

  it('should handle a default create hotel error', () => {
    hotelServiceSpy.createHotel.mockReturnValue(throwError(() => ({})));
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Failed to create hotel.');
    expect(component.isSaving).toBe(false);
  });

  it('should handle a custom update hotel error', () => {
    hotelServiceSpy.updateHotel.mockReturnValue(
      throwError(() => ({ error: { message: 'Update failed' } }))
    );
    component.editingHotelId = 1;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Update failed');
    expect(component.isSaving).toBe(false);
  });

  it('should handle a default update hotel error', () => {
    hotelServiceSpy.updateHotel.mockReturnValue(throwError(() => ({})));
    component.editingHotelId = 1;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Failed to update hotel.');
    expect(component.isSaving).toBe(false);
  });

  it('should edit hotel', () => {
    component.successMessage = 'Saved';
    component.errorMessage = 'Failed';

    component.editHotel(hotel);

    expect(component.editingHotelId).toBe(1);
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.hotelForm.value).toEqual({
      name: 'Harbor Grand',
      location: 'Boston',
      description: 'Waterfront rooms',
    });
  });

  it('should delete hotel and reset the form when deleting the edited hotel', () => {
    hotelServiceSpy.deleteHotel.mockReturnValue(of(undefined));
    const loadHotelsSpy = vi.spyOn(component, 'loadHotels');
    component.editingHotelId = 1;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.deleteHotel(hotel);

    expect(hotelServiceSpy.deleteHotel).toHaveBeenCalledWith(1);
    expect(component.successMessage).toBe('Hotel deleted successfully.');
    expect(component.editingHotelId).toBeNull();
    expect(component.hotelForm.value).toEqual({ name: '', location: '', description: '' });
    expect(component.isDeletingId).toBeNull();
    expect(loadHotelsSpy).toHaveBeenCalled();
  });

  it('should delete hotel without resetting the form when deleting another hotel', () => {
    hotelServiceSpy.deleteHotel.mockReturnValue(of(undefined));
    component.editingHotelId = 2;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.deleteHotel(hotel);

    expect(component.successMessage).toBe('Hotel deleted successfully.');
    expect(component.editingHotelId).toBe(2);
    expect(component.hotelForm.value).toEqual({ name: 'A', location: 'B', description: 'C' });
    expect(component.isDeletingId).toBeNull();
  });

  it('should handle a custom delete hotel error', () => {
    hotelServiceSpy.deleteHotel.mockReturnValue(
      throwError(() => ({ error: { message: 'Delete failed' } }))
    );

    component.deleteHotel(hotel);

    expect(component.errorMessage).toBe('Delete failed');
    expect(component.isDeletingId).toBeNull();
  });

  it('should handle a default delete hotel error', () => {
    hotelServiceSpy.deleteHotel.mockReturnValue(throwError(() => ({})));

    component.deleteHotel(hotel);

    expect(component.errorMessage).toBe('Failed to delete hotel.');
    expect(component.isDeletingId).toBeNull();
  });

  it('should cancel edit and reset the form', () => {
    component.editingHotelId = 5;
    component.hotelForm.setValue({ name: 'A', location: 'B', description: 'C' });

    component.cancelEdit();

    expect(component.editingHotelId).toBeNull();
    expect(component.hotelForm.value).toEqual({ name: '', location: '', description: '' });
  });

  it('should render add mode, messages, empty state, and refresh button state', () => {
    component.successMessage = 'Saved';

    fixture.detectChanges(false);

    let pageText = textContent();
    expect(pageText).toContain('Manage Hotels');
    expect(pageText).toContain('Add Hotel');
    expect(pageText).toContain('Saved');
    expect(pageText).toContain('No hotels found.');
    expect(buttonWithText('Refresh')?.disabled).toBe(false);

    component.errorMessage = 'Load failed';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges(false);
    expect(textContent()).toContain('Load failed');

    fixture = TestBed.createComponent(ManageHotels);
    component = fixture.componentInstance;
    const hotels$ = new Subject<PagedResponse<Hotel>>();
    hotelServiceSpy.getHotelsPage.mockReturnValue(hotels$);
    fixture.detectChanges(false);

    expect(buttonWithText('Refreshing...')?.disabled).toBe(true);
  });

  it('should render hotel cards and invoke refresh, edit, and delete from template clicks', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    hotelServiceSpy.deleteHotel.mockReturnValue(of(undefined));
    const loadHotelsSpy = vi.spyOn(component, 'loadHotels');
    const editHotelSpy = vi.spyOn(component, 'editHotel');
    const deleteHotelSpy = vi.spyOn(component, 'deleteHotel');

    fixture.detectChanges(false);

    const pageText = textContent();
    expect(pageText).toContain('Existing Hotels');
    expect(pageText).toContain('Harbor Grand');
    expect(pageText).toContain('Boston');
    expect(pageText).toContain('Waterfront rooms');
    expect(pageText).toContain('Rooms');

    buttonWithText('Refresh')?.click();
    buttonWithText('Edit')?.click();
    buttonWithText('Delete')?.click();

    expect(loadHotelsSpy).toHaveBeenCalled();
    expect(editHotelSpy).toHaveBeenCalledWith(hotel);
    expect(deleteHotelSpy).toHaveBeenCalledWith(hotel);
  });

  it('should render update mode and invoke cancel from the template', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    component.editingHotelId = 1;
    component.hotelForm.setValue({
      name: 'Harbor Grand',
      location: 'Boston',
      description: 'Waterfront rooms',
    });
    const cancelEditSpy = vi.spyOn(component, 'cancelEdit');

    fixture.detectChanges(false);

    expect(textContent()).toContain('Update Hotel');
    buttonWithText('Cancel')?.click();

    expect(cancelEditSpy).toHaveBeenCalled();
  });

  it('should render saving and deleting disabled states', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(page([hotel])));
    component.isSaving = true;
    component.isDeletingId = 1;

    fixture.detectChanges(false);

    expect(buttonWithText('Saving...')?.disabled).toBe(true);
    expect(buttonWithText('Deleting...')?.disabled).toBe(true);
  });

  it('should submit the reactive form from the template', () => {
    hotelServiceSpy.getHotelsPage.mockReturnValue(of(emptyPage));
    hotelServiceSpy.createHotel.mockReturnValue(of(hotel));
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');

    fixture.detectChanges(false);
    component.hotelForm.setValue({
      name: 'Harbor Grand',
      location: 'Boston',
      description: 'Waterfront rooms',
    });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    form.dispatchEvent(new Event('submit'));

    expect(onSubmitSpy).toHaveBeenCalled();
  });
});
