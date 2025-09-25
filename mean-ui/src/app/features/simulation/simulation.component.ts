import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js';
import { SimulationService, SimulationParamsDto, SimulationResultDto } from '@/core/services/simulation.service';
import { DataDecimation } from '@/shared/utils/data-decimation';
import { RegimeAwareDecimation } from '@/shared/utils/regime-aware-decimation';
import { DEFAULT_DECIMATION_CONFIG } from '@/shared/utils/decimation-config';
import { AccelerationCurveService } from './acceleration-curve/acceleration-curve.service';
import { AccelerationCurvePoint, AccelerationCurveConfig } from './acceleration-curve/acceleration-curve.types';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    NgChartsModule
  ],
  template: `
    <div class="simulation-container">
      <!-- Acceleration Curve Section -->
      <div class="acceleration-curve-container">
        <mat-card class="config-card">
          <mat-card-header>
            <mat-card-title>Acceleration Curve Configuration</mat-card-title>
            <mat-card-subtitle>Configure parameters to generate the acceleration curve by velocity</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="curveForm" class="curve-form">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Threshold Velocity (km/h)</mat-label>
                  <input matInput type="number" formControlName="linearVelocityThreshold" step="1">
                  <mat-hint>Velocity up to which acceleration is constant</mat-hint>
                  <mat-error *ngIf="curveForm.get('linearVelocityThreshold')?.hasError('required')">
                    Required field
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('linearVelocityThreshold')?.hasError('min')">
                    Minimum value: 1 km/h
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('linearVelocityThreshold')?.hasError('max')">
                    Maximum value: 100 km/h
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Initial Acceleration (m/s²)</mat-label>
                  <input matInput type="number" formControlName="initialAcceleration" step="0.1">
                  <mat-hint>Constant acceleration up to threshold velocity</mat-hint>
                  <mat-error *ngIf="curveForm.get('initialAcceleration')?.hasError('required')">
                    Required field
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('initialAcceleration')?.hasError('min')">
                    Minimum value: 0.1 m/s²
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('initialAcceleration')?.hasError('max')">
                    Maximum value: 3.0 m/s²
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Velocity Increment (km/h)</mat-label>
                  <input matInput type="number" formControlName="velocityIncrement" step="0.1">
                  <mat-hint>Curve calculation interval</mat-hint>
                  <mat-error *ngIf="curveForm.get('velocityIncrement')?.hasError('required')">
                    Required field
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('velocityIncrement')?.hasError('min')">
                    Minimum value: 0.1 km/h
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('velocityIncrement')?.hasError('max')">
                    Maximum value: 10 km/h
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Loss Factor</mat-label>
                  <input matInput type="number" formControlName="lossFactor" step="1">
                  <mat-hint>Acceleration reduction factor</mat-hint>
                  <mat-error *ngIf="curveForm.get('lossFactor')?.hasError('required')">
                    Required field
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('lossFactor')?.hasError('min')">
                    Minimum value: 1
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('lossFactor')?.hasError('max')">
                    Maximum value: 1000
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Maximum Velocity (km/h)</mat-label>
                  <input matInput type="number" formControlName="maxVelocity" step="10">
                  <mat-hint>Upper limit for curve calculation</mat-hint>
                  <mat-error *ngIf="curveForm.get('maxVelocity')?.hasError('required')">
                    Required field
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('maxVelocity')?.hasError('min')">
                    Minimum value: 10 km/h
                  </mat-error>
                  <mat-error *ngIf="curveForm.get('maxVelocity')?.hasError('max')">
                    Maximum value: 300 km/h
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" (click)="calculateAccelerationCurve()" [disabled]="!curveForm.valid || isCalculating">
                  <mat-icon>calculate</mat-icon>
                  Calculate Curve
                </button>
                <button mat-raised-button (click)="resetAccelerationCurveForm()">
                  <mat-icon>refresh</mat-icon>
                  Reset
                </button>
                <button mat-raised-button color="accent" (click)="saveAccelerationCurveConfiguration()" [disabled]="!curveForm.valid || curvePoints.length === 0">
                  <mat-icon>save</mat-icon>
                  Save Configuration
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <div class="results-section" *ngIf="curvePoints.length > 0">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>Curve Visualization</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-container">
                <canvas #chartCanvas></canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="table-card">
            <mat-card-header>
              <mat-card-title>Calculated Values</mat-card-title>
              <button mat-icon-button (click)="exportAccelerationCurveToCSV()" matTooltip="Export to CSV" class="export-button">
                <mat-icon>download</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <div class="table-container">
                <table mat-table [dataSource]="curvePoints" class="values-table">
                  <ng-container matColumnDef="velocity">
                    <th mat-header-cell *matHeaderCellDef> Velocity (km/h) </th>
                    <td mat-cell *matCellDef="let point"> {{point.velocity.toFixed(1)}} </td>
                  </ng-container>

                  <ng-container matColumnDef="acceleration">
                    <th mat-header-cell *matHeaderCellDef> Acceleration (m/s²) </th>
                    <td mat-cell *matCellDef="let point"> {{point.acceleration.toFixed(6)}} </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="loading-overlay" *ngIf="isCalculating">
          <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
          <p>Calculating curve...</p>
        </div>
      </div>

      <!-- Physics Simulation Section -->
      <mat-card class="config-card">
        <mat-card-header>
          <mat-card-title>Physics Simulation Parameters</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="simulationForm" (ngSubmit)="onSubmit()" class="physics-form">
            <!-- Physics Parameters -->

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Dwell Time (s)</mat-label>
                <input matInput type="number" formControlName="dwellTime" step="1">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Terminal Layover (s)</mat-label>
                <input matInput type="number" formControlName="terminalLayover" step="1">
              </mat-form-field>
            </div>

            <!-- Stations -->
            <div class="station-section">
              <h3>Stations</h3>
              <div formArrayName="stations">
                @for (station of stationsFormArray.controls; track $index) {
                  <div class="station-item" [formGroupName]="$index">
                    <mat-form-field appearance="outline">
                      <mat-label>Station Name</mat-label>
                      <input matInput formControlName="name">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Distance (km)</mat-label>
                      <input matInput type="number" formControlName="km" step="0.1">
                    </mat-form-field>

                    <button mat-icon-button type="button" color="warn"
                            (click)="removeStation($index)"
                            [disabled]="stationsFormArray.length <= 2">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
              </div>

              <button mat-raised-button type="button" color="accent" (click)="addStation()">
                <mat-icon>add</mat-icon>
                Add Station
              </button>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="simulationForm.invalid || isLoading()">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>play_arrow</mat-icon>
                }
                Run Simulation
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (currentSimulation()) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title>Simulation Results</mat-card-title>
            <mat-card-subtitle>Status: {{ currentSimulation()?.status }}</mat-card-subtitle>

            <!-- Botões de Export e Controle -->
            @if (currentSimulation()?.status === 'completed') {
              <div class="result-actions">
                <button mat-stroked-button color="primary" (click)="exportOriginalDataAsCSV()">
                  <mat-icon>download</mat-icon>
                  Export Dados Completos ({{(originalSimulationData?.results?.time?.length) || 0}} pts)
                </button>

                <button mat-stroked-button color="accent" (click)="exportDisplayDataAsCSV()">
                  <mat-icon>visibility</mat-icon>
                  Export Dados Exibidos ({{displayData.time.length}} pts)
                </button>

                <button mat-stroked-button (click)="resetZoom()">
                  <mat-icon>zoom_out_map</mat-icon>
                  Reset Zoom
                </button>
              </div>
            }
          </mat-card-header>

          <mat-card-content>
            @if (currentSimulation()?.status === 'processing') {
              <div class="loading-container">
                <mat-spinner></mat-spinner>
                <p>Processing simulation...</p>
              </div>
            }

            @if (currentSimulation()?.status === 'failed') {
              <div class="error-message">
                <p>Simulation failed: {{ currentSimulation()?.error }}</p>
              </div>
            }

            @if (currentSimulation()?.status === 'completed' && currentSimulation()?.results) {
              <mat-tab-group>
                <mat-tab label="Position vs Time">
                  <div class="chart-container">
                    <canvas baseChart
                            [data]="positionChartData"
                            [options]="chartOptions"
                            [type]="chartType">
                    </canvas>
                  </div>
                </mat-tab>

                <mat-tab label="Velocity vs Time">
                  <div class="chart-container">
                    <canvas baseChart
                            [data]="velocityChartData"
                            [options]="chartOptions"
                            [type]="chartType">
                    </canvas>
                  </div>
                </mat-tab>

                <mat-tab label="Schedule">
                  <div class="schedule-table">
                    @for (entry of currentSimulation()?.results?.schedule; track entry.station) {
                      <div class="schedule-row">
                        <span class="station-name">{{ entry.station }}</span>
                        <span class="arrival-time">Arrival: {{ formatTime(entry.arrivalTime) }}</span>
                        <span class="departure-time">Departure: {{ formatTime(entry.departureTime) }}</span>
                      </div>
                    }
                  </div>
                </mat-tab>
              </mat-tab-group>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .simulation-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .simulation-form {
      margin-bottom: 20px;
    }

    /* Physics Simulation Styles - matching acceleration curve */
    .physics-form {
      padding: 20px 0;

      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-start;
        margin-top: 20px;

        button {
          mat-icon {
            margin-right: 5px;
          }
        }
      }
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .station-section {
      margin: 20px 0;
    }

    .station-item {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }

    .station-item mat-form-field {
      flex: 1;
    }


    .chart-container {
      height: 400px;
      margin: 20px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 16px;
    }

    .error-message {
      color: #f44336;
      text-align: center;
      padding: 20px;
    }

    .schedule-table {
      margin: 20px 0;
    }

    .schedule-row {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
    }

    .station-name {
      font-weight: 500;
      flex: 1;
    }

    .arrival-time, .departure-time {
      flex: 1;
      text-align: right;
    }

    .result-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .result-actions button {
      font-size: 0.875rem;
    }

    .result-actions mat-icon {
      margin-right: 4px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Acceleration Curve Styles */
    .acceleration-curve-container {
      margin-bottom: 40px;

      .config-card {
        margin-bottom: 20px;

        .curve-form {
          padding: 20px 0;

          .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-start;
            margin-top: 20px;

            button {
              mat-icon {
                margin-right: 5px;
              }
            }
          }
        }
      }

      .results-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;

        @media (max-width: 1200px) {
          grid-template-columns: 1fr;
        }

        .chart-card {
          .chart-container {
            height: 400px;
            padding: 10px;
          }
        }

        .table-card {
          position: relative;

          mat-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .export-button {
              margin-left: auto;
            }
          }

          .table-container {
            max-height: 400px;
            overflow-y: auto;

            .values-table {
              width: 100%;

              th {
                background-color: #f5f5f5;
                font-weight: 600;
              }

              td {
                padding: 8px 16px;
              }

              tr:nth-child(even) {
                background-color: #fafafa;
              }

              tr:hover {
                background-color: #f0f0f0;
              }
            }
          }
        }
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        p {
          margin-top: 10px;
          color: white;
          font-size: 16px;
        }
      }
    }
  `]
})
export class SimulationComponent implements OnInit {
  // Registrar plugins Chart.js
  static {
    Chart.register(zoomPlugin, annotationPlugin, ...registerables);
  }
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  simulationForm: FormGroup;
  isLoading = signal(false);
  currentSimulation = signal<SimulationResultDto | null>(null);

  // Acceleration Curve properties
  curveForm: FormGroup;
  curvePoints: AccelerationCurvePoint[] = [];
  displayedColumns: string[] = ['velocity', 'acceleration'];
  accelerationChart: Chart | null = null;
  isCalculating = false;

  // Dados originais (SEMPRE preservados)
  originalSimulationData: SimulationResultDto | null = null;

  // Dados para exibição (decimados)
  displayData: {
    time: number[];
    position: number[];
    velocity: number[];
  } = { time: [], position: [], velocity: [] };

  chartType: ChartType = 'line';
  positionChartData: ChartData<'line'> = { labels: [], datasets: [] };
  velocityChartData: ChartData<'line'> = { labels: [], datasets: [] };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.3
          },
          pinch: {
            enabled: true
          },
          mode: 'x'
        },
        pan: {
          enabled: true,
          mode: 'x',
          threshold: 10
        }
      },
      annotation: {
        annotations: {} // Será preenchido dinamicamente
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const displayTime = parseFloat(context[0].label);
            const nearestIndex = DataDecimation.findNearestOriginalIndex(
              this.originalSimulationData?.results?.time || [],
              displayTime
            );
            const exactTime = this.originalSimulationData?.results?.time?.[nearestIndex] || displayTime;
            return `Tempo: ${exactTime.toFixed(2)}s`;
          },
          label: (context) => {
            const dataset = context.dataset.label || '';
            const displayValue = context.parsed.y;

            if (this.originalSimulationData?.results) {
              const displayTime = parseFloat(context.label);
              const nearestIndex = DataDecimation.findNearestOriginalIndex(
                this.originalSimulationData.results.time,
                displayTime
              );

              if (dataset.includes('Position')) {
                const exactValue = this.originalSimulationData.results.position[nearestIndex];
                return `Posição Exata: ${exactValue.toFixed(3)} m`;
              } else if (dataset.includes('Velocity')) {
                const exactValue = this.originalSimulationData.results.velocity[nearestIndex];
                return `Velocidade Exata: ${exactValue.toFixed(3)} m/s`;
              }
            }

            const unit = dataset.includes('Position') ? 'm' : 'm/s';
            return `${dataset}: ${displayValue.toFixed(2)} ${unit}`;
          },
          afterBody: (context) => {
            if (!this.originalSimulationData?.results) return [];

            const displayTime = parseFloat(context[0].label);
            const nearestIndex = DataDecimation.findNearestOriginalIndex(
              this.originalSimulationData.results.time,
              displayTime
            );

            return [
              '',
              `Índice original: ${nearestIndex}`,
              `Total de pontos: ${this.originalSimulationData.results.time.length}`,
              `Pontos exibidos: ${this.displayData.time.length}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Tempo (s)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Valor'
        }
      }
    }
  };

  constructor(
    private fb: FormBuilder,
    private simulationService: SimulationService,
    private accelerationCurveService: AccelerationCurveService
  ) {
    this.simulationForm = this.createForm();
    this.curveForm = this.createCurveForm();
  }

  // Acceleration Curve Methods
  calculateCurve(): void {
    if (!this.curveForm.valid) {
      return;
    }

    this.isCalculating = true;
    const config: AccelerationCurveConfig = this.curveForm.value;

    this.curvePoints = this.accelerationCurveService.calculateAccelerationCurve(config);

    setTimeout(() => {
      this.updateAccelerationChart();
      this.isCalculating = false;
    }, 100);
  }

  updateAccelerationChart(): void {
    if (!this.chartCanvas) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    if (this.accelerationChart) {
      this.accelerationChart.destroy();
    }

    const chartConfig: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: this.curvePoints.map(p => p.velocity.toFixed(0)),
        datasets: [{
          label: 'Acceleration (m/s²)',
          data: this.curvePoints.map(p => p.acceleration),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Acceleration Curve by Velocity',
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const velocity = this.curvePoints[context.dataIndex].velocity;
                const acceleration = context.parsed.y;
                return [
                  `Velocity: ${velocity.toFixed(1)} km/h`,
                  `Acceleration: ${acceleration.toFixed(6)} m/s²`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Velocity (km/h)'
            },
            ticks: {
              callback: function(value, index) {
                return index % 10 === 0 ? value : '';
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Acceleration (m/s²)'
            },
            beginAtZero: true
          }
        }
      }
    };

    this.accelerationChart = new Chart(ctx, chartConfig);
  }

  exportAccelerationToCSV(): void {
    const csvContent = this.accelerationCurveService.exportToCSV(this.curvePoints);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `acceleration_curve_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  saveCurveConfiguration(): void {
    const config: AccelerationCurveConfig = this.curveForm.value;
    this.accelerationCurveService.saveCurveConfiguration(config).subscribe({
      next: (response) => {
        console.log('Configuração salva com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao salvar configuração:', error);
      }
    });
  }

  resetCurveForm(): void {
    this.curveForm.reset({
      linearVelocityThreshold: 30,
      initialAcceleration: 1.1,
      velocityIncrement: 1,
      lossFactor: 46,
      maxVelocity: 160
    });
  }

  ngOnInit() {
    this.loadDefaultParameters();
    this.calculateAccelerationCurve();

    this.curveForm.valueChanges.subscribe(() => {
      if (this.curveForm.valid) {
        this.calculateAccelerationCurve();
      }
    });
  }

  get stationsFormArray(): FormArray {
    return this.simulationForm.get('stations') as FormArray;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      dwellTime: [30.0, [Validators.required, Validators.min(0)]],
      terminalLayover: [300.0, [Validators.required, Validators.min(0)]],
      stations: this.fb.array([])
    });
  }

  private createCurveForm(): FormGroup {
    return this.fb.group({
      linearVelocityThreshold: [30, [Validators.required, Validators.min(1), Validators.max(100)]],
      initialAcceleration: [1.1, [Validators.required, Validators.min(0.1), Validators.max(3.0)]],
      velocityIncrement: [1, [Validators.required, Validators.min(0.1), Validators.max(10)]],
      lossFactor: [46, [Validators.required, Validators.min(1), Validators.max(1000)]],
      maxVelocity: [160, [Validators.required, Validators.min(10), Validators.max(300)]]
    });
  }

  private loadDefaultParameters() {
    const defaultStations = [
      { name: 'Station 1', km: 0 },
      { name: 'Station 2', km: 5 },
      { name: 'Station 3', km: 10 },
      { name: 'Station 4', km: 15 }
    ];

    defaultStations.forEach(station => {
      this.stationsFormArray.push(this.createStationGroup(station));
    });
  }

  private createStationGroup(station: { name: string; km: number }): FormGroup {
    return this.fb.group({
      name: [station.name, [Validators.required]],
      km: [station.km, [Validators.required, Validators.min(0)]]
    });
  }

  addStation() {
    const lastStation = this.stationsFormArray.value[this.stationsFormArray.length - 1];
    const newKm = lastStation ? lastStation.km + 5 : 0;

    this.stationsFormArray.push(this.createStationGroup({
      name: `Station ${this.stationsFormArray.length}`,
      km: newKm
    }));
  }

  removeStation(index: number) {
    if (this.stationsFormArray.length > 2) {
      this.stationsFormArray.removeAt(index);
    }
  }

  onSubmit() {
    if (this.simulationForm.valid) {
      this.isLoading.set(true);
      const linearVelocityKmh = this.curveForm.get('linearVelocityThreshold')?.value || 30;
      const thresholdVelocityMs = linearVelocityKmh / 3.6; // Convert km/h to m/s
      const maxVelocityKmh = this.curveForm.get('maxVelocity')?.value || 160;
      const maxVelocityMs = maxVelocityKmh / 3.6; // Convert km/h to m/s

      const params: SimulationParamsDto = {
        ...this.simulationForm.value,
        maxVelocity: maxVelocityMs,
        initialAcceleration: this.curveForm.get('initialAcceleration')?.value || 1.1,
        thresholdVelocity: thresholdVelocityMs
      };

      this.simulationService.createSimulation(params).subscribe({
        next: (response) => {
          this.pollSimulationStatus(response.id);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  private pollSimulationStatus(id: string) {
    const pollInterval = setInterval(() => {
      this.simulationService.getSimulation(id).subscribe({
        next: (simulation) => {
          this.currentSimulation.set(simulation);

          if (simulation.status === 'completed') {
            this.isLoading.set(false);
            clearInterval(pollInterval);
            this.updateCharts(simulation);
          } else if (simulation.status === 'failed') {
            this.isLoading.set(false);
            clearInterval(pollInterval);
          }
        },
        error: () => {
          this.isLoading.set(false);
          clearInterval(pollInterval);
        }
      });
    }, 2000);
  }

  private updateCharts(simulation: SimulationResultDto) {
    if (!simulation.results) return;

    // PRESERVAR dados originais (NUNCA modificados)
    this.originalSimulationData = simulation;

    console.log(`📊 Dados originais: ${simulation.results.time.length} pontos`);

    // DECIMAR dados com consciência de regime
    const maxVelocityKmh = this.curveForm.get('maxVelocity')?.value || 160;
    const maxVelocityMs = maxVelocityKmh / 3.6;
    const simulationParams = {
      max_speed: maxVelocityMs,
      initial_accel: this.curveForm.get('initialAcceleration')?.value || 1.1
    };

    // Converter schedule para formato esperado
    const schedule = (simulation.results.schedule || []).map(entry => ({
      station: entry.station,
      arrival_time: entry.arrivalTime,
      departure_time: entry.departureTime
    }));

    // Usar decimação regime-aware para posição
    const positionDecimated = RegimeAwareDecimation.decimate(
      simulation.results.time,
      simulation.results.position,
      schedule,
      simulationParams,
      {
        ...DEFAULT_DECIMATION_CONFIG,
        maxPointsForDisplay: 1200 // Orçamento adaptativo
      }
    );

    // Usar decimação regime-aware para velocidade
    const velocityDecimated = RegimeAwareDecimation.decimate(
      simulation.results.time,
      simulation.results.velocity,
      schedule,
      simulationParams,
      {
        ...DEFAULT_DECIMATION_CONFIG,
        maxPointsForDisplay: 1200
      }
    );

    // Armazenar dados decimados para referência
    this.displayData = {
      time: positionDecimated.time, // Usar tempo da posição como referência
      position: positionDecimated.values,
      velocity: velocityDecimated.values
    };

    console.log(`📋 Dados exibidos: ${this.displayData.time.length} pontos (${positionDecimated.time.length} posição, ${velocityDecimated.time.length} velocidade)`);
    console.log(`🔄 Redução: ${((1 - this.displayData.time.length / simulation.results.time.length) * 100).toFixed(1)}%`);
    console.log(`🎯 Regime-aware: Eventos preservados, regimes otimizados`);

    // Adicionar marcadores de estações e layover
    this.addStationMarkers();

    // Criar gráficos com dados decimados
    this.positionChartData = {
      labels: positionDecimated.time.map(t => t.toFixed(1)),
      datasets: [{
        label: 'Position (m)',
        data: positionDecimated.time.map((time, index) => ({
          x: time,
          y: positionDecimated.values[index]
        })),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        fill: false,
        pointRadius: 0, // Sem pontos visíveis para melhor performance
        pointHoverRadius: 4
      }]
    };

    this.velocityChartData = {
      labels: velocityDecimated.time.map(t => t.toFixed(1)),
      datasets: [{
        label: 'Velocity (m/s)',
        data: velocityDecimated.time.map((time, index) => ({
          x: time,
          y: velocityDecimated.values[index]
        })),
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: false,
        pointRadius: 0, // Sem pontos visíveis para melhor performance
        pointHoverRadius: 4
      }]
    };
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Métodos de export (usando dados ORIGINAIS)
  exportOriginalDataAsCSV() {
    if (!this.originalSimulationData?.results) {
      console.warn('Nenhum dado original disponível para export');
      return;
    }

    const csvContent = this.convertToCSV(this.originalSimulationData.results);
    this.downloadFile(csvContent, 'simulation_complete_data.csv');
  }

  exportDisplayDataAsCSV() {
    if (this.displayData.time.length === 0) {
      console.warn('Nenhum dado de exibição disponível para export');
      return;
    }

    const csvContent = this.convertToCSV({
      time: this.displayData.time,
      position: this.displayData.position,
      velocity: this.displayData.velocity
    });
    this.downloadFile(csvContent, 'simulation_display_data.csv');
  }

  resetZoom() {
    // Implementar reset de zoom quando necessário
    console.log('Reset zoom - funcionalidade será implementada');
  }

  private convertToCSV(data: { time: number[], position: number[], velocity: number[] }): string {
    const headers = ['Time (s)', 'Position (m)', 'Velocity (m/s)'];
    const rows = [headers.join(',')];

    for (let i = 0; i < data.time.length; i++) {
      const row = [
        data.time[i].toFixed(3),
        data.position[i].toFixed(3),
        data.velocity[i].toFixed(3)
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private addStationMarkers() {
    if (!this.originalSimulationData?.results?.schedule) return;

    const annotations: any = {};

    // Adicionar marcadores para cada estação
    this.originalSimulationData.results.schedule.forEach((entry, index) => {
      // Linha vertical para chegada
      annotations[`station_arrival_${index}`] = {
        type: 'line',
        xMin: entry.arrivalTime,
        xMax: entry.arrivalTime,
        borderColor: '#ff6384',
        borderWidth: 2,
        borderDash: [5, 5],
        label: {
          enabled: true,
          content: `${entry.station}`,
          position: 'start',
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          color: 'white',
          font: {
            size: 10
          }
        }
      };

      // Área para tempo de parada (se > 30s)
      const dwellTime = entry.departureTime - entry.arrivalTime;
      if (dwellTime > 30) {
        annotations[`dwell_${index}`] = {
          type: 'box',
          xMin: entry.arrivalTime,
          xMax: entry.departureTime,
          backgroundColor: dwellTime > 200 ? 'rgba(255, 206, 84, 0.3)' : 'rgba(54, 162, 235, 0.2)',
          borderColor: dwellTime > 200 ? '#ffce56' : '#36a2eb',
          borderWidth: 1,
          label: {
            enabled: true,
            content: dwellTime > 200 ? 'Terminal Layover' : 'Parada',
            position: 'center',
            backgroundColor: dwellTime > 200 ? 'rgba(255, 206, 84, 0.8)' : 'rgba(54, 162, 235, 0.8)',
            color: 'white',
            font: {
              size: 9
            }
          }
        };
      }
    });

    // Atualizar opções do gráfico
    if (this.chartOptions?.plugins?.annotation) {
      this.chartOptions.plugins.annotation.annotations = annotations;
    }

    console.log(`📍 Adicionados ${Object.keys(annotations).length} marcadores visuais`);
  }

  // Additional Acceleration Curve Methods (renamed to avoid conflicts)
  calculateAccelerationCurve(): void {
    if (!this.curveForm.valid) {
      return;
    }

    this.isCalculating = true;
    const config: AccelerationCurveConfig = this.curveForm.value;

    this.curvePoints = this.accelerationCurveService.calculateAccelerationCurve(config);

    setTimeout(() => {
      this.updateAccelerationCurveChart();
      this.isCalculating = false;
    }, 100);
  }

  updateAccelerationCurveChart(): void {
    if (!this.chartCanvas) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    if (this.accelerationChart) {
      this.accelerationChart.destroy();
    }

    const chartConfig: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: this.curvePoints.map(p => p.velocity.toFixed(0)),
        datasets: [{
          label: 'Acceleration (m/s²)',
          data: this.curvePoints.map(p => p.acceleration),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Acceleration Curve by Velocity',
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const velocity = this.curvePoints[context.dataIndex].velocity;
                const acceleration = context.parsed.y;
                return [
                  `Velocity: ${velocity.toFixed(1)} km/h`,
                  `Acceleration: ${acceleration.toFixed(6)} m/s²`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Velocity (km/h)'
            },
            ticks: {
              callback: function(value, index) {
                return index % 10 === 0 ? value : '';
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Acceleration (m/s²)'
            },
            beginAtZero: true
          }
        }
      }
    };

    this.accelerationChart = new Chart(ctx, chartConfig);
  }

  exportAccelerationCurveToCSV(): void {
    const csvContent = this.accelerationCurveService.exportToCSV(this.curvePoints);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `acceleration_curve_${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  saveAccelerationCurveConfiguration(): void {
    const config: AccelerationCurveConfig = this.curveForm.value;
    this.accelerationCurveService.saveCurveConfiguration(config).subscribe({
      next: (response) => {
        console.log('Configuração salva com sucesso:', response);
      },
      error: (error) => {
        console.error('Erro ao salvar configuração:', error);
      }
    });
  }

  resetAccelerationCurveForm(): void {
    this.curveForm.reset({
      linearVelocityThreshold: 30,
      initialAcceleration: 1.1,
      velocityIncrement: 1,
      lossFactor: 46,
      maxVelocity: 160
    });
  }
}