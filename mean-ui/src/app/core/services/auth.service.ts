import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '@/environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '@/core/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  // Signal-based state management
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  // Computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      const user = this.getUserFromToken(token);
      if (user) {
        this.currentUserSignal.set(user);
      }
    } else {
      this.clearTokens();
    }
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => {
        console.log('User registered successfully:', response.user.email);
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        throw error;
      }),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        this.currentUserSignal.set(response.user);
        console.log('User logged in successfully:', response.user.email);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        this.isLoadingSignal.set(false);
        throw error;
      }),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearTokens();
        this.currentUserSignal.set(null);
        this.router.navigate(['/auth/login']);
        console.log('User logged out successfully');
      }),
      catchError(error => {
        // Even if logout fails on server, clear local state
        this.clearTokens();
        this.currentUserSignal.set(null);
        this.router.navigate(['/auth/login']);
        console.error('Logout failed:', error);
        return of(null);
      })
    );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        this.setToken(response.accessToken);
        const user = this.getUserFromToken(response.accessToken);
        if (user) {
          this.currentUserSignal.set(user);
        }
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.clearTokens();
        this.currentUserSignal.set(null);
        this.router.navigate(['/auth/login']);
        throw error;
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  }

  private getUserFromToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        role: payload.role || 'user'
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  // Helper method for checking permissions
  hasRole(role: 'user' | 'admin'): boolean {
    const user = this.currentUserSignal();
    return user?.role === role || (role === 'user' && user?.role === 'admin');
  }
}