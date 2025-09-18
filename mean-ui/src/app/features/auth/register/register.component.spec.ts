import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../core/models/auth.model';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
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
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values and default role', () => {
    expect(component.registerForm.value).toEqual({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
  });

  it('should have invalid form when fields are empty', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should have valid form when all fields are filled correctly', () => {
    component.registerForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'user'
    });

    expect(component.registerForm.valid).toBeTruthy();
  });

  describe('Form validation', () => {
    it('should validate name as required', () => {
      const nameControl = component.registerForm.get('name');

      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBeTruthy();

      nameControl?.setValue('Test User');
      expect(nameControl?.hasError('required')).toBeFalsy();
    });

    it('should validate email format', () => {
      const emailControl = component.registerForm.get('email');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();

      emailControl?.setValue('test@example.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.registerForm.get('password');

      passwordControl?.setValue('123');
      expect(passwordControl?.hasError('minlength')).toBeTruthy();

      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('minlength')).toBeFalsy();
    });

    it('should validate password confirmation match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'different'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();

      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'password123'
      });

      expect(component.registerForm.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should validate role selection', () => {
      const roleControl = component.registerForm.get('role');

      roleControl?.setValue('');
      expect(roleControl?.hasError('required')).toBeTruthy();

      roleControl?.setValue('user');
      expect(roleControl?.hasError('required')).toBeFalsy();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'user'
      });
    });

    it('should call authService.register with form values when form is valid', () => {
      authService.register.and.returnValue(of(mockAuthResponse));

      component.onSubmit();

      expect(authService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
    });

    it('should navigate to dashboard on successful registration', () => {
      authService.register.and.returnValue(of(mockAuthResponse));

      component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should set loading state during registration', () => {
      authService.register.and.returnValue(of(mockAuthResponse));

      expect(component.isLoading()).toBeFalse();

      component.onSubmit();

      expect(component.isLoading()).toBeFalse();
    });

    it('should handle registration error', () => {
      const errorResponse = { error: { message: 'Email already exists' } };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Email já está em uso. Tente outro email.');
      expect(component.isLoading()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      component.registerForm.patchValue({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
      });

      component.onSubmit();

      expect(authService.register).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.registerForm.patchValue({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
      });

      component.onSubmit();

      expect(component.registerForm.get('name')?.touched).toBeTruthy();
      expect(component.registerForm.get('email')?.touched).toBeTruthy();
      expect(component.registerForm.get('password')?.touched).toBeTruthy();
      expect(component.registerForm.get('confirmPassword')?.touched).toBeTruthy();
      expect(component.registerForm.get('role')?.touched).toBeTruthy();
    });

    it('should not submit when passwords do not match', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different',
        role: 'user'
      });

      component.onSubmit();

      expect(authService.register).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should display generic error message for unknown errors', () => {
      const errorResponse = { error: {} };
      authService.register.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'user'
      });

      component.onSubmit();

      expect(component.errorMessage()).toBe('Erro ao criar conta. Tente novamente.');
    });

    it('should clear error message when form values change', () => {
      component['errorMessageSignal'].set('Some error');
      expect(component.errorMessage()).toBe('Some error');

      component.registerForm.get('email')?.setValue('new@example.com');

      expect(component.errorMessage()).toBe('');
    });
  });

  describe('passwordMatchValidator', () => {
    it('should return null when passwords match', () => {
      const form = component.registerForm;
      form.patchValue({
        password: 'password123',
        confirmPassword: 'password123'
      });

      const result = component['passwordMatchValidator'](form);
      expect(result).toBeNull();
    });

    it('should return error object when passwords do not match', () => {
      const form = component.registerForm;
      form.patchValue({
        password: 'password123',
        confirmPassword: 'different'
      });

      const result = component['passwordMatchValidator'](form);
      expect(result).toEqual({ passwordMismatch: true });
    });

    it('should return null when either password is empty', () => {
      const form = component.registerForm;
      form.patchValue({
        password: '',
        confirmPassword: 'password123'
      });

      const result = component['passwordMatchValidator'](form);
      expect(result).toBeNull();
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
      component.registerForm.patchValue({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
      component.registerForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'user'
      });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeFalsy();
    });

    it('should show password mismatch error when passwords do not match', () => {
      component.registerForm.patchValue({
        password: 'password123',
        confirmPassword: 'different'
      });
      component.registerForm.get('confirmPassword')?.markAsTouched();
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('mat-error');
      expect(errorElement?.textContent).toContain('As senhas não coincidem');
    });
  });
});