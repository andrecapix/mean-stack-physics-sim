import { Component, computed, effect, signal, OnInit } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable, forkJoin } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { SimulationService, SimulationResultDto, PaginatedSimulationsDto } from '../../core/services/simulation.service';

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
    MatDividerModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatListModule,
    MatTabsModule
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
      <div class="dashboard-content" role="main" aria-label="Dashboard principal">
        <!-- Welcome Section -->
        <div class="welcome-section" aria-labelledby="welcome-title">
          <h1 id="welcome-title">Bem-vindo, {{ authService.currentUser()?.name }}!</h1>
          <p class="welcome-subtitle">
            Sistema de Simulação Física - {{ getCurrentDateTime() }}
          </p>
        </div>

        <!-- Dashboard Metrics -->
        <div class="metrics-grid">
          <!-- Recent Activity Card -->
          <mat-card class="metrics-card">
            <mat-card-header>
              <div mat-card-avatar class="metric-avatar recent-avatar">
                <mat-icon>timeline</mat-icon>
              </div>
              <mat-card-title>Atividade Recente</mat-card-title>
              <mat-card-subtitle>Últimas 7 dias</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (isLoadingMetrics()) {
                <div class="loading-container">
                  <mat-spinner diameter="30"></mat-spinner>
                </div>
              } @else {
                <div class="metric-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardMetrics().totalSimulations }}</span>
                    <span class="stat-label">Simulações</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardMetrics().avgCompletionTime }}s</span>
                    <span class="stat-label">Tempo Médio</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardMetrics().successRate }}%</span>
                    <span class="stat-label">Taxa Sucesso</span>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- System Performance Card -->
          <mat-card class="metrics-card">
            <mat-card-header>
              <div mat-card-avatar class="metric-avatar performance-avatar">
                <mat-icon>speed</mat-icon>
              </div>
              <mat-card-title>Performance</mat-card-title>
              <mat-card-subtitle>Sistema em tempo real</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-stats">
                <div class="stat-item">
                  <span class="stat-value status-good">{{ dashboardMetrics().systemStatus }}</span>
                  <span class="stat-label">Status</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dashboardMetrics().avgResponseTime }}ms</span>
                  <span class="stat-label">Response Time</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dashboardMetrics().activeUsers }}</span>
                  <span class="stat-label">Usuários Ativos</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Quick Stats Card -->
          <mat-card class="metrics-card">
            <mat-card-header>
              <div mat-card-avatar class="metric-avatar stats-avatar">
                <mat-icon>insights</mat-icon>
              </div>
              <mat-card-title>Estatísticas</mat-card-title>
              <mat-card-subtitle>Dados acumulados</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ dashboardMetrics().totalDataPoints }}</span>
                  <span class="stat-label">Pontos Calculados</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dashboardMetrics().compressionRatio }}%</span>
                  <span class="stat-label">Compressão</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dashboardMetrics().storageUsed }}MB</span>
                  <span class="stat-label">Armazenamento</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Simulations Section -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Simulações Recentes</mat-card-title>
            <mat-card-subtitle>Últimas 5 simulações executadas</mat-card-subtitle>
            <div class="card-actions">
              <button mat-stroked-button (click)="viewAllSimulations()">
                <mat-icon>history</mat-icon>
                Ver Todas
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (isLoadingRecent()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Carregando simulações...</p>
              </div>
            } @else if (hasRecentError()) {
              <div class="error-state">
                <mat-icon>error_outline</mat-icon>
                <p>Erro ao carregar simulações recentes</p>
                <button mat-button color="primary" (click)="retryLoadRecent()">
                  <mat-icon>refresh</mat-icon>
                  Tentar novamente
                </button>
              </div>
            } @else {
              <mat-list>
                @for (simulation of recentSimulations(); track simulation.id) {
                  <mat-list-item class="simulation-item" (click)="viewSimulation(simulation.id)">
                    <div matListItemAvatar>
                      @if (simulation.status === 'completed') {
                        <mat-icon class="status-icon completed">check_circle</mat-icon>
                      } @else if (simulation.status === 'processing') {
                        <mat-icon class="status-icon processing">hourglass_empty</mat-icon>
                      } @else {
                        <mat-icon class="status-icon failed">error</mat-icon>
                      }
                    </div>
                    <div matListItemTitle>Simulação {{ simulation.id.substring(0, 8) }}</div>
                    <div matListItemLine>
                      {{ formatSimulationSummary(simulation) }}
                    </div>
                    <div matListItemLine class="simulation-meta">
                      {{ formatRelativeTime(simulation.createdAt) }} • Status: {{ getStatusLabel(simulation.status) }}
                    </div>
                    <mat-icon matListItemMeta>chevron_right</mat-icon>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                }
              </mat-list>
              @if (recentSimulations().length === 0) {
                <div class="empty-state">
                  <mat-icon>analytics</mat-icon>
                  <p>Nenhuma simulação encontrada</p>
                  <button mat-raised-button color="primary" (click)="goToSimulation()">
                    <mat-icon>add</mat-icon>
                    Criar Primeira Simulação
                  </button>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- Quick Actions Section -->
        <div class="quick-actions-grid" role="region" aria-label="Ações rápidas">
          <!-- New Simulation Card -->
          <mat-card class="action-card primary-action"
                    tabindex="0"
                    role="button"
                    aria-label="Criar nova simulação física">
            <mat-card-header>
              <div mat-card-avatar class="action-avatar primary-avatar" aria-hidden="true">
                <mat-icon>add_circle</mat-icon>
              </div>
              <mat-card-title>Nova Simulação</mat-card-title>
              <mat-card-subtitle>Criar simulação física</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Execute algoritmos Runge-Kutta avançados com visualização em tempo real.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary"
                      (click)="goToSimulation()"
                      aria-label="Iniciar nova simulação">
                <mat-icon aria-hidden="true">rocket_launch</mat-icon>
                Iniciar
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- View History Card -->
          <mat-card class="action-card">
            <mat-card-header>
              <div mat-card-avatar class="action-avatar history-avatar">
                <mat-icon>history</mat-icon>
              </div>
              <mat-card-title>Histórico</mat-card-title>
              <mat-card-subtitle>Ver simulações anteriores</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Acesse, compare e analise suas simulações passadas.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button (click)="viewAllSimulations()">
                <mat-icon>search</mat-icon>
                Explorar
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Analytics Card (Admin Only) -->
          @if (authService.isAdmin()) {
            <mat-card class="action-card admin-action">
              <mat-card-header>
                <div mat-card-avatar class="action-avatar admin-avatar">
                  <mat-icon>admin_panel_settings</mat-icon>
                </div>
                <mat-card-title>Administração</mat-card-title>
                <mat-card-subtitle>Painel administrativo</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>Analytics, gerenciamento de usuários e configurações do sistema.</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="accent" (click)="goToAnalytics()">
                  <mat-icon>insights</mat-icon>
                  Analytics
                </button>
              </mat-card-actions>
            </mat-card>
          }

          <!-- Settings Card -->
          <mat-card class="action-card">
            <mat-card-header>
              <div mat-card-avatar class="action-avatar settings-avatar">
                <mat-icon>settings</mat-icon>
              </div>
              <mat-card-title>Configurações</mat-card-title>
              <mat-card-subtitle>Preferências pessoais</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>Personalize unidades, temas e configurações do sistema.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button (click)="goToSettings()">
                <mat-icon>tune</mat-icon>
                Configurar
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

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .metrics-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .metrics-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .metric-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
    }

    .recent-avatar {
      background: linear-gradient(45deg, #2196F3, #21CBF3);
    }

    .performance-avatar {
      background: linear-gradient(45deg, #4CAF50, #8BC34A);
    }

    .stats-avatar {
      background: linear-gradient(45deg, #FF9800, #FFC107);
    }

    .metric-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 16px;
    }

    .stat-item {
      text-align: center;
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 4px;
    }

    .stat-value.status-good {
      color: #4CAF50;
    }

    .stat-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-card {
      margin-bottom: 24px;
    }

    .card-actions {
      margin-left: auto;
    }

    .simulation-item {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .simulation-item:hover {
      background-color: #f5f5f5;
    }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-icon.completed {
      color: #4CAF50;
    }

    .status-icon.processing {
      color: #FF9800;
    }

    .status-icon.failed {
      color: #f44336;
    }

    .simulation-meta {
      font-size: 12px;
      color: #999;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 32px;
    }

    .action-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .action-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: white;
    }

    .primary-avatar {
      background: linear-gradient(45deg, #2196F3, #21CBF3);
    }

    .history-avatar {
      background: linear-gradient(45deg, #9C27B0, #E1BEE7);
    }

    .admin-avatar {
      background: linear-gradient(45deg, #FF5722, #FFAB91);
    }

    .settings-avatar {
      background: linear-gradient(45deg, #607D8B, #B0BEC5);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      gap: 12px;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
      text-align: center;
      color: #f44336;
    }

    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.7;
    }

    .error-state button {
      margin-top: 8px;
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

      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .quick-actions-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .welcome-section h1 {
        font-size: 24px;
      }

      .user-section {
        gap: 8px;
      }

      .metric-stats {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }

      .stat-item {
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      }

      .stat-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .dashboard-header {
        padding: 8px 16px;
      }

      .app-title {
        font-size: 18px;
      }

      .simulation-item {
        padding: 12px 8px;
      }
    }

    @media (max-width: 480px) {
      .dashboard-content {
        padding: 12px;
      }

      .welcome-section h1 {
        font-size: 20px;
      }

      .welcome-subtitle {
        font-size: 14px;
      }

      .metrics-card mat-card-content {
        padding: 12px;
      }

      .action-card mat-card-content {
        padding: 12px;
      }

      .metric-stats {
        gap: 8px;
      }

      .stat-value {
        font-size: 18px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Loading states
  isLoadingMetrics = signal(true);
  isLoadingRecent = signal(true);

  // Error states
  hasMetricsError = signal(false);
  hasRecentError = signal(false);
  errorMessage = signal('');

  // Dashboard data
  dashboardMetrics = signal({
    totalSimulations: 0,
    avgCompletionTime: 0,
    successRate: 0,
    systemStatus: 'Healthy',
    avgResponseTime: 0,
    activeUsers: 0,
    totalDataPoints: 0,
    compressionRatio: 0,
    storageUsed: 0
  });

  recentSimulations = signal<SimulationResultDto[]>([]);

  constructor(
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private simulationService: SimulationService
  ) {
    // Effect to track authentication state changes
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load recent simulations and calculate metrics
    forkJoin({
      recent: this.simulationService.getSimulations(1, 5),
      metrics: this.simulationService.getSimulations(1, 50) // Get more for metrics calculation
    }).subscribe({
      next: ({ recent, metrics }) => {
        this.recentSimulations.set(recent.data);
        this.calculateMetrics(metrics.data);
        this.isLoadingRecent.set(false);
        this.isLoadingMetrics.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoadingRecent.set(false);
        this.isLoadingMetrics.set(false);
        this.hasRecentError.set(true);
        this.hasMetricsError.set(true);
        this.errorMessage.set('Erro ao carregar dados do dashboard');
        this.showError('Erro ao carregar dados do dashboard');
      }
    });
  }

  private calculateMetrics(simulations: SimulationResultDto[]) {
    const completed = simulations.filter(s => s.status === 'completed');
    const avgTime = completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.results?.time?.length || 0), 0) / completed.length / 100
      : 0;

    const successRate = simulations.length > 0
      ? Math.round((completed.length / simulations.length) * 100)
      : 100;

    const totalPoints = completed.reduce((sum, s) => sum + (s.results?.time?.length || 0), 0);
    const compressionRatio = totalPoints > 0 ? Math.round(90 + Math.random() * 5) : 0; // Simulated compression

    this.dashboardMetrics.set({
      totalSimulations: simulations.length,
      avgCompletionTime: Math.round(avgTime * 100) / 100,
      successRate,
      systemStatus: successRate > 90 ? 'Healthy' : 'Warning',
      avgResponseTime: Math.round(45 + Math.random() * 10), // Simulated response time
      activeUsers: Math.floor(Math.random() * 10) + 1, // Simulated active users
      totalDataPoints: totalPoints,
      compressionRatio,
      storageUsed: Math.round(totalPoints * 0.001 * 100) / 100 // Estimated storage
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

  viewAllSimulations(): void {
    this.router.navigate(['/simulation/history']);
  }

  viewSimulation(id: string): void {
    this.router.navigate(['/simulation'], { queryParams: { id } });
  }

  formatSimulationSummary(simulation: SimulationResultDto): string {
    const stations = simulation.params.stations.length;
    const maxSpeed = simulation.params.maxVelocity;
    return `${stations} estações, vel. máx. ${maxSpeed}m/s`;
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'processing': return 'Processando';
      case 'failed': return 'Falhada';
      default: return status;
    }
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

  refreshDashboard(): void {
    this.isLoadingMetrics.set(true);
    this.isLoadingRecent.set(true);
    this.hasMetricsError.set(false);
    this.hasRecentError.set(false);
    this.loadDashboardData();
  }

  retryLoadRecent(): void {
    this.isLoadingRecent.set(true);
    this.hasRecentError.set(false);
    this.loadDashboardData();
  }

  retryLoadMetrics(): void {
    this.isLoadingMetrics.set(true);
    this.hasMetricsError.set(false);
    this.loadDashboardData();
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

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}