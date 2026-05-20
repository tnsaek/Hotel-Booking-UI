import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, RegisterResponse } from '../../../services/auth-service';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authServiceSpy: {
    register: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const validForm = {
    name: 'Test User',
    email: 'test@test.com',
    phoneNumber: '1234567890',
    password: 'pass123',
    confirmPassword: 'pass123',
  };

  const response: RegisterResponse = {
    id: 1,
    email: 'test@test.com',
    name: 'Test User',
    phoneNumber: '1234567890',
  };

  beforeEach(async () => {
    authServiceSpy = {
      register: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function inputById(id: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }

  function registerButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.btn-register');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.registerForm, 'markAllAsTouched');
    component.registerForm.setValue({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    });

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should not submit if passwords do not match', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.registerForm, 'markAllAsTouched');
    component.registerForm.setValue({
      ...validForm,
      confirmPassword: 'different',
    });

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should register and navigate to login on success', () => {
    authServiceSpy.register.mockReturnValue(of(response));
    component.registerForm.setValue(validForm);

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@test.com',
      phoneNumber: '1234567890',
      password: 'pass123',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.isLoading).toBe(false);
    expect(component.registerForm.enabled).toBe(true);
    expect(component.errorMessage).toBe('');
  });

  it('should handle error with message from error object', () => {
    authServiceSpy.register.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already exists' } }))
    );
    component.registerForm.setValue(validForm);

    component.onSubmit();

    expect(component.errorMessage).toBe('Email already exists');
    expect(component.isLoading).toBe(false);
    expect(component.registerForm.enabled).toBe(true);
  });

  it('should handle error with string error', () => {
    authServiceSpy.register.mockReturnValue(throwError(() => ({ error: 'Registration blocked' })));
    component.registerForm.setValue(validForm);

    component.onSubmit();

    expect(component.errorMessage).toBe('Registration blocked');
    expect(component.isLoading).toBe(false);
    expect(component.registerForm.enabled).toBe(true);
  });

  it('should handle error with default message', () => {
    authServiceSpy.register.mockReturnValue(throwError(() => ({})));
    component.registerForm.setValue(validForm);

    component.onSubmit();

    expect(component.errorMessage).toBe('Registration failed. Please try again.');
    expect(component.isLoading).toBe(false);
    expect(component.registerForm.enabled).toBe(true);
  });

  it('should validate matching passwords', () => {
    component.registerForm.setValue(validForm);

    expect(component.passwordMatchValidator(component.registerForm)).toBeNull();
  });

  it('should reject mismatched passwords', () => {
    component.registerForm.setValue({
      ...validForm,
      confirmPassword: 'fail123',
    });

    expect(component.passwordMatchValidator(component.registerForm)).toEqual({ mismatch: true });
  });

  it('should reject missing password controls in the password matcher', () => {
    expect(component.passwordMatchValidator({ get: () => null })).toEqual({ mismatch: true });
  });

  it('should render error message, validation messages, and error input classes', () => {
    component.errorMessage = 'Email already exists';
    component.registerForm.setValue({
      name: 'A',
      email: 'bad-email',
      phoneNumber: '',
      password: '123',
      confirmPassword: 'different',
    });
    component.registerForm.markAllAsTouched();

    fixture.detectChanges(false);

    const pageText = textContent();
    expect(pageText).toContain('Email already exists');
    expect(pageText).toContain('Name must be at least 2 characters');
    expect(pageText).toContain('Please enter a valid email address');
    expect(pageText).toContain('Phone number is required');
    expect(pageText).toContain('Password must be at least 6 characters');
    expect(pageText).toContain('Passwords do not match');
    expect(inputById('name').classList.contains('error')).toBe(true);
    expect(inputById('email').classList.contains('error')).toBe(true);
    expect(inputById('phoneNumber').classList.contains('error')).toBe(true);
    expect(inputById('password').classList.contains('error')).toBe(true);
    expect(inputById('confirmPassword').classList.contains('error')).toBe(true);
    expect(registerButton().disabled).toBe(true);
  });

  it('should render confirm password error class for a touched required error', () => {
    component.registerForm.setValue({
      ...validForm,
      confirmPassword: '',
    });
    component.registerForm.get('confirmPassword')?.markAsTouched();

    fixture.detectChanges(false);

    expect(inputById('confirmPassword').classList.contains('error')).toBe(true);
  });

  it('should render the loading submit state', () => {
    component.registerForm.setValue(validForm);
    component.isLoading = true;

    fixture.detectChanges(false);

    expect(textContent()).toContain('Creating Account...');
    expect(registerButton().disabled).toBe(true);
  });

  it('should render the enabled create account state for a valid form', () => {
    component.registerForm.setValue(validForm);

    fixture.detectChanges(false);

    expect(textContent()).toContain('Create Account');
    expect(registerButton().disabled).toBe(false);
  });

  it('should submit the reactive form from the template', () => {
    authServiceSpy.register.mockReturnValue(of(response));
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');
    component.registerForm.setValue(validForm);

    fixture.detectChanges(false);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(onSubmitSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
