import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="analytics-container">
      <h1>Analytics Dashboard</h1>
      <p>Painel administrativo do sistema - Funcionalidade em desenvolvimento.</p>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Estatísticas do Sistema</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Este componente será implementado na próxima fase do projeto.</p>
          <ul>
            <li>Métricas de usuários</li>
            <li>Performance do sistema</li>
            <li>Dados de uso</li>
            <li>Relatórios</li>
          </ul>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button>
            <mat-icon>refresh</mat-icon>
            Atualizar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 20px;
    }
  `]
})
export class AnalyticsComponent {}