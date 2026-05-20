import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function runInterceptor(req: HttpRequest<unknown>) {
    let forwardedRequest: HttpRequest<unknown> | null = null;
    const next = vi.fn((request: HttpRequest<unknown>) => {
      forwardedRequest = request;
      return of(new HttpResponse());
    });
    authInterceptor(req, next);
    return { next, get forwardedRequest() { return forwardedRequest; } };
  }

  it('should skip auth login and register requests', () => {
    localStorage.setItem('auth_token', 'token');

    let req = new HttpRequest('POST', '/api/auth/login', {});
    let { next } = runInterceptor(req);
    expect(next).toHaveBeenCalledWith(req);

    req = new HttpRequest('POST', '/api/auth/register', {});
    next = runInterceptor(req).next;
    expect(next).toHaveBeenCalledWith(req);
  });

  it('should skip public hotel get requests', () => {
    localStorage.setItem('auth_token', 'token');
    const req = new HttpRequest('GET', '/api/hotels');

    const { next } = runInterceptor(req);

    expect(next).toHaveBeenCalledWith(req);
  });

  it('should pass through protected requests without a token', () => {
    const req = new HttpRequest('GET', '/api/bookings');

    const { next } = runInterceptor(req);

    expect(next).toHaveBeenCalledWith(req);
  });

  it('should add bearer token to protected requests', () => {
    localStorage.setItem('auth_token', 'abc123');
    const req = new HttpRequest('POST', '/api/bookings', {});

    const { forwardedRequest } = runInterceptor(req);

    expect(forwardedRequest?.headers.get('Authorization')).toBe('Bearer abc123');
  });
});
