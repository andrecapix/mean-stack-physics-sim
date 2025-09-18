import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService, RegisterRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Criar Conta</mat-card-title>
          <mat-card-subtitle>Preencha os dados para criar sua conta</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome Completo</mat-label>
              <input
                matInput
                type="text"
                formControlName="name"
                placeholder="Seu nome completo"
                [class.is-invalid]="registerForm.get('name')?.invalid && registerForm.get('name')?.touched">
              <mat-icon matSuffix>person</mat-icon>
              @if (registerForm.get('name')?.hasError('required') && registerForm.get('name')?.touched) {
                <mat-error>Nome é obrigatório</mat-error>
              }
              @if (registerForm.get('name')?.hasError('minlength') && registerForm.get('name')?.touched) {
                <mat-error>Nome deve ter pelo menos 2 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="seu@email.com"
                [class.is-invalid]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              <mat-icon matSuffix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>Email é obrigatório</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Email inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                placeholder="Sua senha"
                [class.is-invalid]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="'Hide password'"
                [attr.aria-pressed]="hidePassword()">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Senha é obrigatória</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                <mat-error>Senha deve ter pelo menos 6 caracteres</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar Senha</mat-label>
              <input
                matInput
                [type]="hideConfirmPassword() ? 'password' : 'text'"
                formControlName="confirmPassword"
                placeholder="Confirme sua senha"
                [class.is-invalid]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched">
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="toggleConfirmPasswordVisibility()"
                [attr.aria-label]="'Hide confirm password'"
                [attr.aria-pressed]="hideConfirmPassword()">
                <mat-icon>{{hideConfirmPassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (registerForm.get('confirmPassword')?.hasError('required') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Confirmação de senha é obrigatória</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirmPassword')?.touched) {
                <mat-error>Senhas não coincidem</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo de Usuário</mat-label>
              <mat-select formControlName="role">
                <mat-option value="user">Usuário</mat-option>
                <mat-option value="admin">Administrador</mat-option>
              </mat-select>
              <mat-icon matSuffix>admin_panel_settings</mat-icon>
            </mat-form-field>

            @if (errorMessage()) {
              <div class="error-message">
                {{ errorMessage() }}
              </div>
            }

            <div class="register-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="registerForm.invalid || authService.isLoading()"
                class="full-width">
                @if (authService.isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Criando conta...
                } @else {
                  Criar Conta
                }
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="login-link">
            Já tem uma conta?
            <a [routerLink]="['/auth/login']" class="login-button">Faça login</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .register-card {
      width: 100%;
      max-width: 450px;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .register-actions {
      margin-top: 20px;
    }

    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 16px;
      padding: 8px;
      background-color: #ffebee;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }

    .login-link {
      text-align: center;
      margin: 16px 0 0 0;
      font-size: 14px;
    }

    .login-button {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .login-button:hover {
      text-decoration: underline;
    }

    mat-spinner {
      margin-right: 10px;
    }

    .is-invalid {
      border-color: #f44336;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['user', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.errorMessage.set('');
      const { confirmPassword, ...registerRequest } = this.registerForm.value;

      this.authService.register(registerRequest as RegisterRequest).subscribe({
        next: (response) => {
          this.snackBar.open('Conta criada com sucesso! Faça login para continuar.', 'Fechar', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });

          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Register error:', error);
          let errorMsg = 'Erro ao criar conta. Tente novamente.';

          if (error.status === 409 || error.error?.message?.includes('email')) {
            errorMsg = 'Este email já está em uso.';
          } else if (error.status === 400) {
            errorMsg = 'Dados inválidos. Verifique os campos.';
          } else if (error.status === 0) {
            errorMsg = 'Erro de conexão. Verifique sua internet.';
          }

          this.errorMessage.set(errorMsg);
          this.snackBar.open(errorMsg, 'Fechar', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}