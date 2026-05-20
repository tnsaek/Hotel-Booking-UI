import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments';
import { AuthService, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const user = {
    id: 1,
    email: 'admin@test.com',
    name: 'Admin',
    role: 'ADMIN',
  };

  function tokenWithExp(exp: number): string {
    return `header.${btoa(JSON.stringify({ exp }))}.signature`;
  }

  function createService(): AuthService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    service = createService();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and persist token and current user when token is returned', () => {
    const requestBody: LoginRequest = {
      email: 'admin@test.com',
      password: 'password',
    };
    const response: LoginResponse = {
      ...user,
      token: tokenWithExp(Math.floor(Date.now() / 1000) + 3600),
    };

    service.login(requestBody).subscribe((loginResponse) => {
      expect(loginResponse).toEqual(response);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush(response);

    expect(service.getToken()).toBe(response.token);
    expect(service.getCurrentUser()).toEqual(user);
  });

  it('should not persist user when login response has no token', () => {
    const response = { ...user, token: '' };

    service.login({ email: 'a@b.com', password: 'password' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(response);

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should register a user', () => {
    const requestBody: RegisterRequest = {
      name: 'User',
      email: 'user@test.com',
      phoneNumber: '123',
      password: 'password',
    };
    const response: RegisterResponse = {
      id: 2,
      email: 'user@test.com',
      name: 'User',
      phoneNumber: '123',
    };

    service.register(requestBody).subscribe((registerResponse) => {
      expect(registerResponse).toEqual(response);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    request.flush(response);
  });

  it('should set token and current user manually', () => {
    const token = tokenWithExp(Math.floor(Date.now() / 1000) + 3600);

    service.setToken(token);
    service.setCurrentUser(user);

    expect(service.getToken()).toBe(token);
    expect(service.getCurrentUser()).toEqual(user);
    expect(service.isAdmin()).toBe(true);
  });

  it('should authenticate valid tokens and reject missing, expired, invalid, and no-exp tokens', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.setToken(tokenWithExp(Math.floor(Date.now() / 1000) + 3600));
    expect(service.isAuthenticated()).toBe(true);

    service.setToken(tokenWithExp(Math.floor(Date.now() / 1000) - 1));
    service.setCurrentUser(user);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();

    service.setToken('invalid-token');
    expect(service.isAuthenticated()).toBe(false);

    service.setToken(`header.${btoa(JSON.stringify({}))}.signature`);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should load saved user when stored token is valid', () => {
    const token = tokenWithExp(Math.floor(Date.now() / 1000) + 3600);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    service = createService();

    expect(service.getCurrentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear saved session when stored token is expired', () => {
    localStorage.setItem('auth_token', tokenWithExp(Math.floor(Date.now() / 1000) - 1));
    localStorage.setItem('auth_user', JSON.stringify(user));

    service = createService();

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should logout and clear the session', () => {
    service.setToken(tokenWithExp(Math.floor(Date.now() / 1000) + 3600));
    service.setCurrentUser(user);

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });
});
