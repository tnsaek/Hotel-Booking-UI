import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  token: string;
  email: string;
  name: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          this.setCurrentUser({
            id: response.id,
            email: response.email,
            name: response.name,
            role: response.role,
          });
        }
      })
    );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, request);
  }

  logout(): void {
    this.clearSession();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'ADMIN';
  }

  private loadUser(): void {
    const token = this.getToken();
    const savedUser = localStorage.getItem(this.userKey);
    if (token && savedUser && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(JSON.parse(savedUser) as AuthUser);
      return;
    }

    this.clearSession();
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      const exp = typeof payload.exp === 'number' ? payload.exp : null;
      if (!exp) {
        return true;
      }

      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }
}
