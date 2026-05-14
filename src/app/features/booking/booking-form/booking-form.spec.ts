import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingForm } from './booking-form';

describe('BookingForm', () => {
  let component: BookingForm;
  let fixture: ComponentFixture<BookingForm>;
  let bookingServiceSpy: any;
  let authServiceSpy: any;
  let routerSpy: any;
  let routeStub: any;

  beforeEach(async () => {
    bookingServiceSpy = {
      createBooking: jasmine.createSpy('createBooking'),
      cacheBooking: jasmine.createSpy('cacheBooking')
    };
    authServiceSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
      getCurrentUser: jasmine.createSpy('getCurrentUser'),
      logout: jasmine.createSpy('logout')
    };
    routerSpy = { navigate: jasmine.createSpy('navigate') };
    routeStub = { snapshot: { paramMap: { get: () => '1' } } };
    await TestBed.configureTestingModule({
      imports: [BookingForm],
      providers: [
        { provide: 'BookingService', useValue: bookingServiceSpy },
        { provide: 'AuthService', useValue: authServiceSpy },
        { provide: 'Router', useValue: routerSpy },
        { provide: 'ActivatedRoute', useValue: routeStub },
      ],
    }).overrideComponent(BookingForm, {
      set: {
        providers: [
          { provide: 'BookingService', useValue: bookingServiceSpy },
          { provide: 'AuthService', useValue: authServiceSpy },
          { provide: 'Router', useValue: routerSpy },
          { provide: 'ActivatedRoute', useValue: routeStub },
        ],
      },
    }).compileComponents();
    fixture = TestBed.createComponent(BookingForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
    component.roomId = 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get today date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(component.getTodayDate()).toBe(today);
  });

  it('should get tomorrow date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = tomorrow.toISOString().split('T')[0];
    expect(component.getTomorrowDate()).toBe(expected);
  });

  it('should validate future date', () => {
    const control = { value: '1900-01-01' };
    expect(component.futureDateValidator(control)).toEqual({ pastDate: true });
    const today = new Date().toISOString().split('T')[0];
    expect(component.futureDateValidator({ value: today })).toBeNull();
  });

  it('should validate date range', () => {
    const form: any = {
      get: (key: string) => ({
        checkIn: { value: '2024-01-01' },
        checkOut: { value: '2024-01-02' },
      }[key])
    };
    expect(component.dateRangeValidator(form)).toBeNull();
    const invalidForm: any = {
      get: (key: string) => ({
        checkIn: { value: '2024-01-02' },
        checkOut: { value: '2024-01-01' },
      }[key])
    };
    expect(component.dateRangeValidator(invalidForm)).toEqual({ invalidRange: true });
  });

  it('should not submit if form is invalid', () => {
    spyOn(component.form, 'markAllAsTouched');
    component.form.setValue({ checkIn: '', checkOut: '' });
    component.submit();
    expect(component.form.markAllAsTouched).toHaveBeenCalled();
    expect(bookingServiceSpy.createBooking).not.toHaveBeenCalled();
  });

  it('should redirect to login if not authenticated', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.markAsTouched();
    component.form.markAsDirty();
    component.form.updateValueAndValidity();
    component.form.markAsTouched();
    component.form.markAsDirty();
    component.form.updateValueAndValidity();
    component.form.markAllAsTouched = () => {};
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(false);
    component.submit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login if no current user', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue(null);
    component.submit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should create booking and navigate to payment on success', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 2 });
    const response = { bookingId: 123 };
    bookingServiceSpy.createBooking.and.returnValue({ subscribe: ({ next }: any) => { next(response); return { unsubscribe: () => {} }; } });
    component.submit();
    expect(bookingServiceSpy.createBooking).toHaveBeenCalled();
    expect(bookingServiceSpy.cacheBooking).toHaveBeenCalledWith(2, response);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/payment', 123]);
  });

  it('should handle 401/403 error and logout', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 2 });
    bookingServiceSpy.createBooking.and.returnValue({ subscribe: ({ next, error }: any) => { error({ status: 401 }); return { unsubscribe: () => {} }; } });
    component.submit();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle date conflict error', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 2 });
    bookingServiceSpy.createBooking.and.returnValue({ subscribe: ({ next, error }: any) => { error({ error: { message: 'Room already booked' } }); return { unsubscribe: () => {} }; } });
    component.submit();
    expect(component.dateConflictMessage).toContain('Room already booked');
    expect(component.errorMessage).toBe('');
  });

  it('should handle generic booking error', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 2 });
    bookingServiceSpy.createBooking.and.returnValue({ subscribe: ({ next, error }: any) => { error({ error: { message: 'fail' } }); return { unsubscribe: () => {} }; } });
    component.submit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should handle string error', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 2 });
    bookingServiceSpy.createBooking.and.returnValue({ subscribe: ({ next, error }: any) => { error({ error: 'fail2' }); return { unsubscribe: () => {} }; } });
    component.submit();
    expect(component.errorMessage).toBe('fail2');
  });

  it('should handle default booking error', () => {
    component.form.setValue({ checkIn: '2026-05-10', checkOut: '2026-05-11' });
    component.form.invalid = false;
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getCurrentUser.and.returnValue({ id: 2 });
    bookingServiceSpy.createBooking.and.returnValue({ subscribe: ({ next, error }: any) => { error({}); return { unsubscribe: () => {} }; } });
    component.submit();
    expect(component.errorMessage).toBe('Booking failed. Please try again.');
  });
});
