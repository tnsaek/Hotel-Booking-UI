import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BookingResponse } from '../../../models/booking-response';
import { AuthService } from '../../../services/auth-service';
import { BookingService } from '../../../services/booking-service';
import { BookingForm } from './booking-form';

describe('BookingForm', () => {
  let component: BookingForm;
  let fixture: ComponentFixture<BookingForm>;
  let bookingServiceSpy: {
    createBooking: ReturnType<typeof vi.fn>;
    cacheBooking: ReturnType<typeof vi.fn>;
  };
  let authServiceSpy: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const response: BookingResponse = {
    bookingId: 123,
    status: 'PENDING',
    totalAmount: 250,
    checkIn: '2026-06-20',
    checkOut: '2026-06-21',
    roomId: 7,
    roomNumber: 301,
    roomType: 'SUITE',
    hotelName: 'Harbor Grand',
  };

  beforeEach(async () => {
    bookingServiceSpy = {
      createBooking: vi.fn(),
      cacheBooking: vi.fn(),
    };
    authServiceSpy = {
      isAuthenticated: vi.fn(),
      getCurrentUser: vi.fn(),
      logout: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BookingForm],
      providers: [
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => '7' },
              queryParamMap: { get: () => null },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingForm);
    component = fixture.componentInstance;
  });

  function setValidForm(): void {
    component.form.setValue({ checkIn: '2026-06-20', checkOut: '2026-06-21' });
  }

  function authenticate(user: { id: number } | null = { id: 2 }): void {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    authServiceSpy.getCurrentUser.mockReturnValue(user);
  }

  function textContent(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function inputById(id: string): HTMLInputElement {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`Expected input #${id} to exist`);
    }
    return input;
  }

  function submitButton(): HTMLButtonElement {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!button) {
      throw new Error('Expected submit button to exist');
    }
    return button;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the room id on init', () => {
    component.ngOnInit();

    expect(component.roomId).toBe(7);
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
    expect(component.futureDateValidator({ value: '' })).toBeNull();
    expect(component.futureDateValidator({ value: '1900-01-01' })).toEqual({ pastDate: true });
    expect(component.futureDateValidator({ value: component.getTomorrowDate() })).toBeNull();
  });

  it('should validate date range', () => {
    const emptyForm = { get: () => ({ value: '' }) };
    const missingControlsForm = { get: () => null };
    const validForm = {
      get: (key: string) => ({
        checkIn: { value: '2026-05-20' },
        checkOut: { value: '2026-05-21' },
      }[key]),
    };
    const invalidForm = {
      get: (key: string) => ({
        checkIn: { value: '2026-05-21' },
        checkOut: { value: '2026-05-20' },
      }[key]),
    };

    expect(component.dateRangeValidator(emptyForm)).toBeNull();
    expect(component.dateRangeValidator(missingControlsForm)).toBeNull();
    expect(component.dateRangeValidator(validForm)).toBeNull();
    expect(component.dateRangeValidator(invalidForm)).toEqual({ invalidRange: true });
  });

  it('should not submit if form is invalid', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.form, 'markAllAsTouched');
    component.form.setValue({ checkIn: '', checkOut: '' });

    component.submit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(bookingServiceSpy.createBooking).not.toHaveBeenCalled();
  });

  it('should redirect to login if not authenticated', () => {
    setValidForm();
    component.roomId = 7;
    authServiceSpy.isAuthenticated.mockReturnValue(false);

    component.submit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(bookingServiceSpy.createBooking).not.toHaveBeenCalled();
  });

  it('should redirect to login if no current user exists', () => {
    setValidForm();
    component.roomId = 7;
    authenticate(null);

    component.submit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(bookingServiceSpy.createBooking).not.toHaveBeenCalled();
  });

  it('should create booking, cache it, and navigate to payment on success', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(of(response));

    component.submit();

    expect(bookingServiceSpy.createBooking).toHaveBeenCalledWith({
      userId: 2,
      roomId: 7,
      checkIn: '2026-06-20',
      checkOut: '2026-06-21',
    });
    expect(bookingServiceSpy.cacheBooking).toHaveBeenCalledWith(2, response);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/payment', 123]);
    expect(component.isSubmitting).toBe(false);
  });

  it('should handle 401 errors by logging out and navigating to login', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(throwError(() => ({ status: 401 })));

    component.submit();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 403 errors by logging out and navigating to login', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(throwError(() => ({ status: 403 })));

    component.submit();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle date conflict errors', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(
      throwError(() => ({ error: { message: 'Room already booked for those dates' } }))
    );

    component.submit();

    expect(component.dateConflictMessage).toBe('Room already booked for those dates');
    expect(component.errorMessage).toBe('');
    expect(component.isSubmitting).toBe(false);
    expect(component.form.enabled).toBe(true);
  });

  it('should handle generic object booking errors', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(
      throwError(() => ({ error: { message: 'Server failed' } }))
    );

    component.submit();

    expect(component.errorMessage).toBe('Server failed');
    expect(component.dateConflictMessage).toBe('');
    expect(component.isSubmitting).toBe(false);
    expect(component.form.enabled).toBe(true);
  });

  it('should handle string booking errors', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(throwError(() => ({ error: 'String fail' })));

    component.submit();

    expect(component.errorMessage).toBe('String fail');
    expect(component.isSubmitting).toBe(false);
    expect(component.form.enabled).toBe(true);
  });

  it('should handle default booking errors', () => {
    setValidForm();
    component.roomId = 7;
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(throwError(() => ({})));

    component.submit();

    expect(component.errorMessage).toBe('Booking failed. Please try again.');
    expect(component.isSubmitting).toBe(false);
    expect(component.form.enabled).toBe(true);
  });

  it('should render server and date conflict messages', () => {
    component.errorMessage = 'Server failed';
    component.dateConflictMessage = 'Room already booked';

    fixture.detectChanges();

    const text = textContent();
    expect(text).toContain('Server failed');
    expect(text).toContain('Room already booked');
    expect((fixture.nativeElement as HTMLElement).querySelector('.booking-conflict')?.textContent).toContain(
      'Room already booked'
    );
  });

  it('should render date input minimum values', () => {
    fixture.detectChanges();

    expect(inputById('checkIn').getAttribute('min')).toBe(component.getTodayDate());
    expect(inputById('checkOut').getAttribute('min')).toBe(component.getTomorrowDate());
  });

  it('should render required validation messages and error classes', () => {
    component.form.setValue({ checkIn: '', checkOut: '' });
    component.form.markAllAsTouched();

    fixture.detectChanges();

    const text = textContent();
    expect(text).toContain('Check-in date is required');
    expect(text).toContain('Check-out date is required');
    expect(inputById('checkIn').classList.contains('error')).toBe(true);
    expect(inputById('checkOut').classList.contains('error')).toBe(true);
    expect(submitButton().disabled).toBe(true);
  });

  it('should render past date and invalid range validation messages', () => {
    component.form.setValue({ checkIn: '1900-01-02', checkOut: '1900-01-01' });
    component.form.markAllAsTouched();

    fixture.detectChanges();

    const text = textContent();
    expect(text).toContain('Check-in date must be today or later');
    expect(text).toContain('Check-out date must be after check-in date');
  });

  it('should render the enabled submit state', () => {
    setValidForm();
    component.isSubmitting = false;

    fixture.detectChanges();

    expect(submitButton().disabled).toBe(false);
    expect(submitButton().textContent).toContain('Confirm Booking');
  });

  it('should render the loading submit state', () => {
    setValidForm();
    component.isSubmitting = true;

    fixture.detectChanges();

    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toContain('Creating Booking...');
  });

  it('should submit the reactive form from the template', () => {
    component.ngOnInit();
    authenticate({ id: 2 });
    bookingServiceSpy.createBooking.mockReturnValue(of(response));
    fixture.detectChanges();

    inputById('checkIn').value = '2026-06-20';
    inputById('checkIn').dispatchEvent(new Event('input'));
    inputById('checkOut').value = '2026-06-21';
    inputById('checkOut').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>('form')?.dispatchEvent(
      new Event('submit')
    );

    expect(bookingServiceSpy.createBooking).toHaveBeenCalledWith({
      userId: 2,
      roomId: 7,
      checkIn: '2026-06-20',
      checkOut: '2026-06-21',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/payment', 123]);
  });
});
