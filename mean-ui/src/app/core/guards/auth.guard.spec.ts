import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { signal } from '@angular/core';

describe('Auth Guards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;
  let isAuthenticatedSignal: any;
  let isAdminSignal: any;

  beforeEach(() => {
    isAuthenticatedSignal = signal(false);
    isAdminSignal = signal(false);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken'], {
      isAuthenticated: isAuthenticatedSignal,
      isAdmin: isAdminSignal
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    route = {} as ActivatedRouteSnapshot;
    state = { url: '/dashboard' } as RouterStateSnapshot;
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      // Set up authenticated state
      isAuthenticatedSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(route, state)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', () => {
      // Set up unauthenticated state
      isAuthenticatedSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(route, state)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('adminGuard', () => {
    it('should allow access when user is authenticated and admin', () => {
      // Set up authenticated admin state
      isAuthenticatedSignal.set(true);
      isAdminSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(route, state)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard when user is authenticated but not admin', () => {
      // Set up authenticated non-admin state
      isAuthenticatedSignal.set(true);
      isAdminSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(route, state)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect to login when user is not authenticated', () => {
      // Set up unauthenticated state
      isAuthenticatedSignal.set(false);
      isAdminSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(route, state)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      // Set up unauthenticated state
      isAuthenticatedSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(route, state)
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to dashboard when user is authenticated', () => {
      // Set up authenticated state
      isAuthenticatedSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(route, state)
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle rapid authentication state changes', () => {
      // Initially unauthenticated
      isAuthenticatedSignal.set(false);
      let result = TestBed.runInInjectionContext(() =>
        authGuard(route, state)
      );
      expect(result).toBe(false);

      // Change to authenticated
      isAuthenticatedSignal.set(true);
      result = TestBed.runInInjectionContext(() =>
        authGuard(route, state)
      );
      expect(result).toBe(true);
    });

    it('should handle admin role changes', () => {
      // Initially regular user
      isAuthenticatedSignal.set(true);
      isAdminSignal.set(false);

      let result = TestBed.runInInjectionContext(() =>
        adminGuard(route, state)
      );
      expect(result).toBe(false);

      // Upgrade to admin
      isAdminSignal.set(true);
      result = TestBed.runInInjectionContext(() =>
        adminGuard(route, state)
      );
      expect(result).toBe(true);
    });
  });
});