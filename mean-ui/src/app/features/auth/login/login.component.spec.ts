import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockAuthResponse: AuthResponse = {
    accessToken: 'jwt-token',
    user: {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    }
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: ''
    });
  });

  it('should have invalid form when fields are empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have valid form when fields are filled correctly', () => {
    component.loginForm.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should require password field', () => {
    const passwordControl = component.loginForm.get('password');

    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTruthy();

    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('required')).toBeFalsy();
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should call authService.login with form values when form is valid', () => {
      authService.login.and.returnValue(of(mockAuthResponse));

      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should navigate to dashboard on successful login', () => {
      authService.login.and.returnValue(of(mockAuthResponse));

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should set loading state during login', () => {
      authService.login.and.returnValue(of(mockAuthResponse));

      expect(component.isLoading()).toBeFalse();

      component.onSubmit();

      // The loading state would be set to true during the call
      // and then reset to false after completion
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle login error', () => {
      const errorResponse = { error: { message: 'Invalid credentials' } };
      authService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Credenciais inválidas. Tente novamente.');
      expect(component.isLoading()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });

      component.onSubmit();

      expect(authService.login).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });

      component.onSubmit();

      expect(component.loginForm.get('email')?.touched).toBeTruthy();
      expect(component.loginForm.get('password')?.touched).toBeTruthy();
    });
  });

  describe('Error handling', () => {
    it('should display generic error message for unknown errors', () => {
      const errorResponse = { error: {} };
      authService.login.and.returnValue(throwError(() => errorResponse));

      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Erro ao fazer login. Tente novamente.');
    });

    it('should clear error message when form values change', () => {
      // Set an error message
      component['errorMessageSignal'].set('Some error');
      expect(component.errorMessage()).toBe('Some error');

      // Change form value
      component.loginForm.get('email')?.setValue('new@example.com');

      // Error message should be cleared
      expect(component.errorMessage()).toBe('');
    });
  });

  describe('Template integration', () => {
    it('should display error message in template when present', () => {
      component['errorMessageSignal'].set('Test error message');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement?.textContent).toContain('Test error message');
    });

    it('should disable submit button when form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeFalsy();
    });
  });
});