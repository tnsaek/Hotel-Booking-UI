import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../../services/auth-service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceSpy: jasmine.SpyObj<any>;
  let routerSpy: jasmine.SpyObj<any>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    spyOn(component.loginForm, 'markAllAsTouched');
    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();
    expect(component.loginForm.markAllAsTouched).toHaveBeenCalled();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should login and navigate to admin if role is ADMIN', () => {
    component.loginForm.setValue({ email: 'admin@test.com', password: 'password' });
    authServiceSpy.login.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({ role: 'ADMIN' }) }) });
    component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/hotels']);
  });

  it('should login and navigate to search if role is not ADMIN', () => {
    component.loginForm.setValue({ email: 'user@test.com', password: 'password' });
    authServiceSpy.login.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({ role: 'USER' }) }) });
    component.onSubmit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/search']);
  });

  it('should handle error with message from error object', () => {
    component.loginForm.setValue({ email: 'fail@test.com', password: 'password' });
    authServiceSpy.login.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should handle error with string error', () => {
    component.loginForm.setValue({ email: 'fail2@test.com', password: 'password' });
    authServiceSpy.login.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: 'fail2' }) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('fail2');
  });

  it('should handle error with default message', () => {
    component.loginForm.setValue({ email: 'fail3@test.com', password: 'password' });
    authServiceSpy.login.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({}) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('Login failed. Please try again.');
  });
});
