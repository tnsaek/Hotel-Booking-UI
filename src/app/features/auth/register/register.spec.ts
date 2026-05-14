import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authServiceSpy: jasmine.SpyObj<any>;
  let routerSpy: jasmine.SpyObj<any>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: 'AuthService', useValue: authServiceSpy },
        { provide: 'Router', useValue: routerSpy },
      ],
    }).overrideComponent(Register, {
      set: {
        providers: [
          { provide: 'AuthService', useValue: authServiceSpy },
          { provide: 'Router', useValue: routerSpy },
        ],
      },
    }).compileComponents();
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit if form is invalid', () => {
    spyOn(component.registerForm, 'markAllAsTouched');
    component.registerForm.setValue({
      name: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
    });
    component.onSubmit();
    expect(component.registerForm.markAllAsTouched).toHaveBeenCalled();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should not submit if passwords do not match', () => {
    component.registerForm.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'pass456'
    });
    spyOn(component.registerForm, 'markAllAsTouched');
    component.onSubmit();
    expect(component.registerForm.markAllAsTouched).toHaveBeenCalled();
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should register and navigate to login on success', () => {
    component.registerForm.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'pass123'
    });
    authServiceSpy.register.and.returnValue({ pipe: () => ({ subscribe: ({ next }: any) => next({}) }) });
    component.onSubmit();
    expect(authServiceSpy.register).toHaveBeenCalledWith({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123'
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle error with message from error object', () => {
    component.registerForm.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'pass123'
    });
    authServiceSpy.register.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: { message: 'fail' } }) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('fail');
  });

  it('should handle error with string error', () => {
    component.registerForm.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'pass123'
    });
    authServiceSpy.register.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({ error: 'fail2' }) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('fail2');
  });

  it('should handle error with default message', () => {
    component.registerForm.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'pass123'
    });
    authServiceSpy.register.and.returnValue({ pipe: () => ({ subscribe: ({ error }: any) => error({}) }) });
    component.onSubmit();
    expect(component.errorMessage).toBe('Registration failed. Please try again.');
  });

  it('should validate password match', () => {
    const form = component.registerForm;
    form.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'pass123'
    });
    expect(component.passwordMatchValidator(form)).toBeNull();
    form.setValue({
      name: 'Test', email: 'test@test.com', phoneNumber: '123', password: 'pass123', confirmPassword: 'fail' });
    expect(component.passwordMatchValidator(form)).toEqual({ mismatch: true });
  });
});
