import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SimulationService, SimulationResultDto, PaginatedSimulationsDto } from '../../../core/services/simulation.service';

@Component({
  selector: 'app-simulation-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="history-container">
      <!-- Header -->
      <div class="history-header">
        <div class="header-content">
          <h1>Histórico de Simulações</h1>
          <p class="header-subtitle">
            Visualize, compare e gerencie suas simulações passadas
          </p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="createNewSimulation()">
            <mat-icon>add</mat-icon>
            Nova Simulação
          </button>
        </div>
      </div>

      <!-- Filters Section -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <!-- Search Input -->
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar simulações</mat-label>
              <input matInput
                     [formControl]="searchControl"
                     placeholder="ID, parâmetros, etc...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <!-- Status Filter -->
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusControl" multiple>
                <mat-option value="completed">Concluída</mat-option>
                <mat-option value="processing">Processando</mat-option>
                <mat-option value="failed">Falhada</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Date Range -->
            <mat-form-field appearance="outline">
              <mat-label>Data início</mat-label>
              <input matInput
                     [matDatepicker]="startPicker"
                     [formControl]="startDateControl">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Data fim</mat-label>
              <input matInput
                     [matDatepicker]="endPicker"
                     [formControl]="endDateControl">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <!-- Clear Filters -->
            <button mat-stroked-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Limpar
            </button>
          </div>

          <!-- Active Filters Display -->
          @if (hasActiveFilters()) {
            <div class="active-filters">
              <span class="filters-label">Filtros ativos:</span>
              <mat-chip-set>
                @if (searchControl.value) {
                  <mat-chip (removed)="clearSearch()">
                    Busca: "{{ searchControl.value }}"
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @for (status of statusControl.value || []; track status) {
                  <mat-chip (removed)="removeStatusFilter(status)">
                    Status: {{ getStatusLabel(status) }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @if (startDateControl.value) {
                  <mat-chip (removed)="clearStartDate()">
                    Desde: {{ formatDate(startDateControl.value) }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
                @if (endDateControl.value) {
                  <mat-chip (removed)="clearEndDate()">
                    Até: {{ formatDate(endDateControl.value) }}
                    <mat-icon matChipRemove>cancel</mat-icon>
                  </mat-chip>
                }
              </mat-chip-set>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Results Section -->
      <mat-card class="results-card">
        <mat-card-header>
          <mat-card-title>
            Resultados
            @if (!isLoading()) {
              <span class="results-count">({{ totalResults() }} encontradas)</span>
            }
          </mat-card-title>
          @if (!isLoading()) {
            <div class="results-actions">
              <button mat-stroked-button (click)="exportResults()">
                <mat-icon>download</mat-icon>
                Exportar
              </button>
              <button mat-stroked-button (click)="refreshResults()">
                <mat-icon>refresh</mat-icon>
                Atualizar
              </button>
            </div>
          }
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Carregando simulações...</p>
            </div>
          } @else if (simulations().length === 0) {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <h3>Nenhuma simulação encontrada</h3>
              <p>Tente ajustar os filtros ou criar uma nova simulação.</p>
              <button mat-raised-button color="primary" (click)="createNewSimulation()">
                <mat-icon>add</mat-icon>
                Criar Simulação
              </button>
            </div>
          } @else {
            <!-- Simulations Table -->
            <div class="table-container">
              <table mat-table [dataSource]="simulations()" class="simulations-table">
                <!-- ID Column -->
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let simulation">
                    <div class="id-cell">
                      <span class="id-short">{{ getShortId(simulation.id) }}</span>
                      <button mat-icon-button (click)="copyId(simulation.id)" matTooltip="Copiar ID completo">
                        <mat-icon>content_copy</mat-icon>
                      </button>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let simulation">
                    <div class="status-cell">
                      <mat-icon [class]="'status-icon ' + simulation.status">
                        {{ getStatusIcon(simulation.status) }}
                      </mat-icon>
                      <span>{{ getStatusLabel(simulation.status) }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Parameters Column -->
                <ng-container matColumnDef="params">
                  <th mat-header-cell *matHeaderCellDef>Parâmetros</th>
                  <td mat-cell *matCellDef="let simulation">
                    <div class="params-cell">
                      <div class="param-line">
                        <strong>{{ simulation.params.stations.length }}</strong> estações
                      </div>
                      <div class="param-line">
                        Vel. máx: <strong>{{ simulation.params.maxVelocity }}m/s</strong>
                      </div>
                      <div class="param-line">
                        Aceleração: <strong>{{ simulation.params.initialAcceleration }}m/s²</strong>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <!-- Date Column -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Data</th>
                  <td mat-cell *matCellDef="let simulation">
                    <div class="date-cell">
                      <div class="date-time">{{ formatDateTime(simulation.createdAt) }}</div>
                      <div class="date-relative">{{ formatRelativeTime(simulation.createdAt) }}</div>
                    </div>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Ações</th>
                  <td mat-cell *matCellDef="let simulation">
                    <div class="actions-cell">
                      <button mat-icon-button
                              (click)="viewSimulation(simulation.id)"
                              matTooltip="Visualizar">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      @if (simulation.status === 'completed') {
                        <button mat-icon-button
                                (click)="downloadSimulation(simulation.id)"
                                matTooltip="Download">
                          <mat-icon>download</mat-icon>
                        </button>
                      }
                      <button mat-icon-button
                              [matMenuTriggerFor]="actionMenu"
                              matTooltip="Mais opções">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #actionMenu="matMenu">
                        <button mat-menu-item (click)="duplicateSimulation(simulation)">
                          <mat-icon>content_copy</mat-icon>
                          Duplicar
                        </button>
                        <button mat-menu-item (click)="shareSimulation(simulation.id)">
                          <mat-icon>share</mat-icon>
                          Compartilhar
                        </button>
                        <button mat-menu-item (click)="deleteSimulation(simulation.id)" class="delete-action">
                          <mat-icon>delete</mat-icon>
                          Excluir
                        </button>
                      </mat-menu>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    (click)="viewSimulation(row.id)"
                    class="clickable-row"></tr>
              </table>
            </div>

            <!-- Pagination -->
            <mat-paginator
              [length]="totalResults()"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[5, 10, 20, 50]"
              [pageIndex]="currentPage() - 1"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 400;
    }

    .header-subtitle {
      color: #666;
      margin: 0;
      font-size: 16px;
    }

    .filters-card {
      margin-bottom: 20px;
    }

    .filters-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr auto;
      gap: 16px;
      align-items: start;
    }

    .search-field {
      min-width: 300px;
    }

    .active-filters {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filters-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .results-card {
      min-height: 400px;
    }

    .results-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .results-count {
      font-size: 14px;
      font-weight: normal;
      color: #666;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 60px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: #333;
    }

    .table-container {
      overflow-x: auto;
      margin-bottom: 16px;
    }

    .simulations-table {
      width: 100%;
      min-width: 800px;
    }

    .clickable-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .clickable-row:hover {
      background-color: #f5f5f5;
    }

    .id-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .id-short {
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }

    .status-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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

    .params-cell {
      font-size: 13px;
      line-height: 1.4;
    }

    .param-line {
      margin-bottom: 2px;
    }

    .date-cell {
      font-size: 13px;
    }

    .date-time {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .date-relative {
      color: #666;
      font-size: 12px;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .delete-action {
      color: #f44336;
    }

    @media (max-width: 1200px) {
      .filters-row {
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }

      .search-field {
        min-width: auto;
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 768px) {
      .history-container {
        padding: 16px;
      }

      .history-header {
        flex-direction: column;
        gap: 16px;
      }

      .filters-row {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class HistoryComponent implements OnInit {
  // Form controls
  searchControl = new FormControl('');
  statusControl = new FormControl<string[]>([]);
  startDateControl = new FormControl<Date | null>(null);
  endDateControl = new FormControl<Date | null>(null);

  // State signals
  isLoading = signal(true);
  simulations = signal<SimulationResultDto[]>([]);
  totalResults = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  // Table configuration
  displayedColumns = ['id', 'status', 'params', 'date', 'actions'];

  constructor(
    private simulationService: SimulationService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.setupFilterSubscriptions();
    this.loadSimulations();
  }

  private setupFilterSubscriptions() {
    // Debounce search input
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadSimulations();
      });

    // React to status filter changes
    this.statusControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadSimulations();
    });

    // React to date filter changes
    this.startDateControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadSimulations();
    });

    this.endDateControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadSimulations();
    });
  }

  private loadSimulations() {
    this.isLoading.set(true);

    // In a real implementation, pass filter parameters to the service
    this.simulationService.getSimulations(this.currentPage(), this.pageSize()).subscribe({
      next: (response: PaginatedSimulationsDto) => {
        this.simulations.set(response.data);
        this.totalResults.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading simulations:', error);
        this.isLoading.set(false);
        this.snackBar.open('Erro ao carregar simulações', 'Fechar', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadSimulations();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchControl.value ||
              this.statusControl.value?.length ||
              this.startDateControl.value ||
              this.endDateControl.value);
  }

  clearFilters() {
    this.searchControl.setValue('');
    this.statusControl.setValue([]);
    this.startDateControl.setValue(null);
    this.endDateControl.setValue(null);
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  removeStatusFilter(status: string) {
    const current = this.statusControl.value || [];
    this.statusControl.setValue(current.filter(s => s !== status));
  }

  clearStartDate() {
    this.startDateControl.setValue(null);
  }

  clearEndDate() {
    this.endDateControl.setValue(null);
  }

  refreshResults() {
    this.loadSimulations();
  }

  exportResults() {
    this.snackBar.open('Exportação iniciada...', 'Fechar', { duration: 3000 });
  }

  createNewSimulation() {
    this.router.navigate(['/simulation']);
  }

  viewSimulation(id: string) {
    this.router.navigate(['/simulation'], { queryParams: { id } });
  }

  downloadSimulation(id: string) {
    this.snackBar.open('Download iniciado...', 'Fechar', { duration: 3000 });
  }

  duplicateSimulation(simulation: SimulationResultDto) {
    this.router.navigate(['/simulation'], {
      queryParams: { duplicate: simulation.id }
    });
  }

  shareSimulation(id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/simulation?id=${id}`);
    this.snackBar.open('Link copiado para área de transferência', 'Fechar', { duration: 3000 });
  }

  deleteSimulation(id: string) {
    if (confirm('Tem certeza que deseja excluir esta simulação?')) {
      this.snackBar.open('Simulação excluída', 'Fechar', { duration: 3000 });
      this.loadSimulations();
    }
  }

  copyId(id: string) {
    navigator.clipboard.writeText(id);
    this.snackBar.open('ID copiado', 'Fechar', { duration: 2000 });
  }

  getShortId(id: string): string {
    return id.substring(0, 8);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'processing': return 'hourglass_empty';
      case 'failed': return 'error';
      default: return 'help';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'processing': return 'Processando';
      case 'failed': return 'Falhada';
      default: return status;
    }
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
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
}