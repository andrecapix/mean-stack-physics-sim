import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="users-container">
      <h1>Gerenciamento de Usuários</h1>
      <p>Painel de administração de usuários - Funcionalidade em desenvolvimento.</p>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Lista de Usuários</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Este componente será implementado na próxima fase do projeto.</p>
          <ul>
            <li>Lista de usuários</li>
            <li>Edição de perfis</li>
            <li>Controle de permissões</li>
            <li>Ativação/Desativação</li>
          </ul>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button>
            <mat-icon>add</mat-icon>
            Novo Usuário
          </button>
          <button mat-button>
            <mat-icon>refresh</mat-icon>
            Atualizar
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
    }
  `]
})
export class UsersComponent {}