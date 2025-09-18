import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <mat-toolbar color="primary" class="dashboard-header">
        <span class="app-title">
          <mat-icon>analytics</mat-icon>
          Physics Simulation
        </span>

        <span class="spacer"></span>

        <!-- User Menu -->
        <div class="user-section">
          <mat-chip-set>
            <mat-chip [class]="getRoleClass()">
              <mat-icon matChipAvatar>{{ getRoleIcon() }}</mat-icon>
              {{ getRoleLabel() }}
            </mat-chip>
          </mat-chip-set>

          <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
            <mat-icon matBadge="1" matBadgeColor="accent" matBadgeSize="small">account_circle</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <div class="user-info">
              <div class="user-name">{{ authService.currentUser()?.name }}</div>
              <div class="user-email">{{ authService.currentUser()?.email }}</div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="goToProfile()">
              <mat-icon>person</mat-icon>
              <span>Perfil</span>
            </button>
            <button mat-menu-item (click)="goToSettings()">
              <mat-icon>settings</mat-icon>
              <span>Configurações</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()" class="logout-button">
              <mat-icon>logout</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </div>
      </mat-toolbar>

      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <h1>Bem-vindo, {{ authService.currentUser()?.name }}!</h1>
          <p class="welcome-subtitle">
            Sistema de Simulação Física - {{ getCurrentDateTime() }}
          </p>
        </div>

        <!-- Feature Cards -->
        <div class="feature-grid">
          <!-- Simulation Card -->
          <mat-card class="feature-card simulation-card">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar simulation-avatar">
                <mat-icon>rocket_launch</mat-icon>
              </div>
              <mat-card-title>Simulações</mat-card-title>
              <mat-card-subtitle>Execute simulações físicas avançadas</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Crie e execute simulações de movimento usando algoritmos Runge-Kutta com visualização em tempo real.</p>
              <div class="feature-stats">
                <div class="stat">
                  <span class="stat-number">12</span>
                  <span class="stat-label">Simulações</span>
                </div>
                <div class="stat">
                  <span class="stat-number">95%</span>
                  <span class="stat-label">Precisão</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="goToSimulation()">
                <mat-icon>play_arrow</mat-icon>
                Nova Simulação
              </button>
              <button mat-button (click)="viewSimulationHistory()">
                <mat-icon>history</mat-icon>
                Histórico
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Analytics Card (Admin Only) -->
          @if (authService.isAdmin()) {
            <mat-card class="feature-card analytics-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar analytics-avatar">
                  <mat-icon>bar_chart</mat-icon>
                </div>
                <mat-card-title>Analytics</mat-card-title>
                <mat-card-subtitle>Painel administrativo do sistema</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Visualize métricas do sistema, performance e dados de uso por todos os usuários.</p>
                <div class="feature-stats">
                  <div class="stat">
                    <span class="stat-number">250</span>
                    <span class="stat-label">Usuários</span>
                  </div>
                  <div class="stat">
                    <span class="stat-number">1.2k</span>
                    <span class="stat-label">Simulações</span>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="accent" (click)="goToAnalytics()">
                  <mat-icon>insights</mat-icon>
                  Ver Analytics
                </button>
                <button mat-button (click)="manageUsers()">
                  <mat-icon>group</mat-icon>
                  Usuários
                </button>
              </mat-card-actions>
            </mat-card>
          }

          <!-- Documentation Card -->
          <mat-card class="feature-card docs-card">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar docs-avatar">
                <mat-icon>menu_book</mat-icon>
              </div>
              <mat-card-title>Documentação</mat-card-title>
              <mat-card-subtitle>Guias e referências do sistema</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Acesse tutoriais, documentação da API e exemplos de uso do sistema de simulação.</p>
              <div class="feature-stats">
                <div class="stat">
                  <span class="stat-number">15</span>
                  <span class="stat-label">Tutoriais</span>
                </div>
                <div class="stat">
                  <span class="stat-number">45</span>
                  <span class="stat-label">Exemplos</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button (click)="goToDocs()">
                <mat-icon>launch</mat-icon>
                Ver Docs
              </button>
              <button mat-button (click)="downloadExamples()">
                <mat-icon>download</mat-icon>
                Exemplos
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Settings Card -->
          <mat-card class="feature-card settings-card">
            <mat-card-header>
              <div mat-card-avatar class="card-avatar settings-avatar">
                <mat-icon>tune</mat-icon>
              </div>
              <mat-card-title>Configurações</mat-card-title>
              <mat-card-subtitle>Personalize sua experiência</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Configure preferências, unidades de medida, temas e outras opções do sistema.</p>
              <div class="feature-stats">
                <div class="stat">
                  <span class="stat-number">8</span>
                  <span class="stat-label">Temas</span>
                </div>
                <div class="stat">
                  <span class="stat-number">12</span>
                  <span class="stat-label">Unidades</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button (click)="goToSettings()">
                <mat-icon>settings</mat-icon>
                Configurar
              </button>
              <button mat-button (click)="exportSettings()">
                <mat-icon>file_download</mat-icon>
                Exportar
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .dashboard-header {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
    }

    .app-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-menu-button {
      margin-left: 8px;
    }

    .user-info {
      padding: 16px;
      min-width: 200px;
    }

    .user-name {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .user-email {
      font-size: 12px;
      color: #666;
    }

    .logout-button {
      color: #f44336;
    }

    .dashboard-content {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-section {
      margin-bottom: 32px;
      text-align: center;
    }

    .welcome-section h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 300;
      color: #333;
    }

    .welcome-subtitle {
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }

    .feature-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .card-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: white;
    }

    .simulation-avatar {
      background: linear-gradient(45deg, #2196F3, #21CBF3);
    }

    .analytics-avatar {
      background: linear-gradient(45deg, #FF6B6B, #FFE66D);
    }

    .docs-avatar {
      background: linear-gradient(45deg, #4ECDC4, #44A08D);
    }

    .settings-avatar {
      background: linear-gradient(45deg, #A8EDEA, #FED6E3);
      color: #333;
    }

    .feature-stats {
      display: flex;
      gap: 24px;
      margin-top: 16px;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 600;
      color: #1976d2;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-admin {
      background-color: #ff5722 !important;
      color: white !important;
    }

    .role-user {
      background-color: #2196f3 !important;
      color: white !important;
    }

    @media (max-width: 768px) {
      .dashboard-content {
        padding: 16px;
      }

      .feature-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .welcome-section h1 {
        font-size: 24px;
      }

      .user-section {
        gap: 8px;
      }
    }
  `]
})
export class DashboardComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Effect to track authentication state changes
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRoleLabel(): string {
    return this.authService.isAdmin() ? 'Administrador' : 'Usuário';
  }

  getRoleIcon(): string {
    return this.authService.isAdmin() ? 'admin_panel_settings' : 'person';
  }

  getRoleClass(): string {
    return this.authService.isAdmin() ? 'role-admin' : 'role-user';
  }

  // Navigation methods
  goToSimulation(): void {
    this.router.navigate(['/simulation']);
  }

  viewSimulationHistory(): void {
    this.router.navigate(['/simulation/history']);
  }

  goToAnalytics(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/analytics']);
    } else {
      this.showAccessDenied();
    }
  }

  manageUsers(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/users']);
    } else {
      this.showAccessDenied();
    }
  }

  goToDocs(): void {
    window.open('/docs', '_blank');
  }

  downloadExamples(): void {
    this.snackBar.open('Download de exemplos iniciado!', 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  exportSettings(): void {
    this.snackBar.open('Configurações exportadas!', 'Fechar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.snackBar.open('Logout realizado com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Navigation still happens in the service
      }
    });
  }

  private showAccessDenied(): void {
    this.snackBar.open('Acesso negado. Apenas administradores podem acessar esta função.', 'Fechar', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}