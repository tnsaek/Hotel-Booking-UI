import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, LoginResponse } from '../../../services/auth-service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceSpy: {
    login: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const adminResponse: LoginResponse = {
    id: 1,
    token: 'token',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'ADMIN',
  };

  const userResponse: LoginResponse = {
    ...adminResponse,
    role: 'USER',
  };

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  });

  function textContent(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  function emailInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#email');
  }

  function passwordInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#password');
  }

  function loginButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.btn-login');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    const markAllAsTouchedSpy = vi.spyOn(component.loginForm, 'markAllAsTouched');
    component.loginForm.setValue({ email: '', password: '' });

    component.onSubmit();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should login and navigate to admin for ADMIN role', () => {
    authServiceSpy.login.mockReturnValue(of(adminResponse));
    component.loginForm.setValue({ email: 'admin@test.com', password: 'password' });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'admin@test.com',
      password: 'password',
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/hotels']);
    expect(component.isLoading).toBe(false);
    expect(component.loginForm.enabled).toBe(true);
    expect(component.errorMessage).toBe('');
  });

  it('should login and navigate to search for non-admin role', () => {
    authServiceSpy.login.mockReturnValue(of(userResponse));
    component.loginForm.setValue({ email: 'user@test.com', password: 'password' });

    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
    expect(component.isLoading).toBe(false);
    expect(component.loginForm.enabled).toBe(true);
  });

  it('should handle error with message from error object', () => {
    authServiceSpy.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } }))
    );
    component.loginForm.setValue({ email: 'fail@test.com', password: 'password' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBe(false);
    expect(component.loginForm.enabled).toBe(true);
  });

  it('should handle error with string error', () => {
    authServiceSpy.login.mockReturnValue(throwError(() => ({ error: 'Login blocked' })));
    component.loginForm.setValue({ email: 'fail2@test.com', password: 'password' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Login blocked');
    expect(component.isLoading).toBe(false);
    expect(component.loginForm.enabled).toBe(true);
  });

  it('should handle error with default message', () => {
    authServiceSpy.login.mockReturnValue(throwError(() => ({})));
    component.loginForm.setValue({ email: 'fail3@test.com', password: 'password' });

    component.onSubmit();

    expect(component.errorMessage).toBe('Login failed. Please try again.');
    expect(component.isLoading).toBe(false);
    expect(component.loginForm.enabled).toBe(true);
  });

  it('should render error message, validation messages, and error input classes', () => {
    component.errorMessage = 'Invalid credentials';
    component.loginForm.setValue({ email: 'bad-email', password: '123' });
    component.loginForm.markAllAsTouched();

    fixture.detectChanges(false);

    const pageText = textContent();
    expect(pageText).toContain('Invalid credentials');
    expect(pageText).toContain('Please enter a valid email address');
    expect(pageText).toContain('Password must be at least 6 characters');
    expect(emailInput().classList.contains('error')).toBe(true);
    expect(passwordInput().classList.contains('error')).toBe(true);
    expect(loginButton().disabled).toBe(true);
  });

  it('should render the loading submit state', () => {
    component.loginForm.setValue({ email: 'user@test.com', password: 'password' });
    component.isLoading = true;

    fixture.detectChanges(false);

    expect(textContent()).toContain('Logging in...');
    expect(loginButton().disabled).toBe(true);
  });

  it('should render the enabled login state for a valid form', () => {
    component.loginForm.setValue({ email: 'user@test.com', password: 'password' });

    fixture.detectChanges(false);

    expect(textContent()).toContain('Login');
    expect(loginButton().disabled).toBe(false);
  });

  it('should submit the reactive form from the template', () => {
    authServiceSpy.login.mockReturnValue(of(userResponse));
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');
    component.loginForm.setValue({ email: 'user@test.com', password: 'password' });

    fixture.detectChanges(false);
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    expect(onSubmitSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
  });
});
