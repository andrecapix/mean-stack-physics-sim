import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponse, User } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user'
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'jwt-token',
    user: mockUser
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have initial state with no user', () => {
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.isAdmin()).toBeFalse();
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully and set user state', () => {
      service.login(loginDto).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTrue();
        expect(localStorage.getItem('accessToken')).toBe('jwt-token');
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginDto);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', () => {
      service.login(loginDto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(service.currentUser()).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user'
    };

    it('should register successfully and set user state', () => {
      service.register(registerDto).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(service.currentUser()).toEqual(mockUser);
        expect(service.isAuthenticated()).toBeTrue();
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerDto);
      req.flush(mockAuthResponse);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('accessToken', 'jwt-token');
      service['currentUserSignal'].set(mockUser);
    });

    it('should logout successfully and clear state', () => {
      service.logout().subscribe(response => {
        expect(response).toEqual({ success: true });
        expect(service.currentUser()).toBeNull();
        expect(service.isAuthenticated()).toBeFalse();
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should clear state even if logout request fails', () => {
      service.logout().subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          expect(service.currentUser()).toBeNull();
          expect(service.isAuthenticated()).toBeFalse();
          expect(localStorage.getItem('accessToken')).toBeNull();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/logout');
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      const refreshResponse = { accessToken: 'new-jwt-token' };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(refreshResponse);
        expect(localStorage.getItem('accessToken')).toBe('new-jwt-token');
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/refresh');
      expect(req.request.method).toBe('POST');
      req.flush(refreshResponse);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('accessToken', 'stored-token');
      expect(service.getToken()).toBe('stored-token');
    });

    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  // Note: parseJwtPayload is a private method, testing through public methods

  describe('isAdmin computed property', () => {
    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, role: 'admin' as const };
      // Test through public API - simulate login with admin user
      service.login({email: 'admin@test.com', password: 'test'}).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      req.flush({accessToken: 'token', user: adminUser});

      expect(service.isAdmin()).toBeTrue();
    });

    it('should return false for regular user', () => {
      service.login({email: 'user@test.com', password: 'test'}).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      req.flush(mockAuthResponse);

      expect(service.isAdmin()).toBeFalse();
    });

    it('should return false when no user is set', () => {
      expect(service.isAdmin()).toBeFalse();
    });
  });
});