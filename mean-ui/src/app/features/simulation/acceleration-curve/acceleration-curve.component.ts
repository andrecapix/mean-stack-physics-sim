import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { AccelerationCurveService } from './acceleration-curve.service';
import { AccelerationCurvePoint, AccelerationCurveConfig } from './acceleration-curve.types';

Chart.register(...registerables);

@Component({
  selector: 'app-acceleration-curve',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './acceleration-curve.component.html',
  styleUrls: ['./acceleration-curve.component.scss']
})
export class AccelerationCurveComponent implements OnInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  curveForm: FormGroup;
  curvePoints: AccelerationCurvePoint[] = [];
  displayedColumns: string[] = ['velocity', 'acceleration'];
  chart: Chart | null = null;
  isCalculating = false;

  constructor(
    private fb: FormBuilder,
    private accelerationCurveService: AccelerationCurveService
  ) {
    this.curveForm = this.fb.group({
      linearVelocityThreshold: [30, [Validators.required, Validators.min(1), Validators.max(100)]],
      initialAcceleration: [1.1, [Validators.required, Validators.min(0.1), Validators.max(3.0)]],
      velocityIncrement: [1, [Validators.required, Validators.min(0.1), Validators.max(10)]],
      lossFactor: [46, [Validators.required, Validators.min(1), Validators.max(1000)]],
      maxVelocity: [160, [Validators.required, Validators.min(10), Validators.max(300)]]
    });
  }

  ngOnInit(): void {
    this.calculateCurve();

    this.curveForm.valueChanges.subscribe(() => {
      if (this.curveForm.valid) {
        this.calculateCurve();
      }
    });
  }

  calculateCurve(): void {
    if (!this.curveForm.valid) {
      return;
    }

    this.isCalculating = true;
    const config: AccelerationCurveConfig = this.curveForm.value;

    this.curvePoints = this.accelerationCurveService.calculateAccelerationCurve(config);

    setTimeout(() => {
      this.updateChart();
      this.isCalculating = false;
    }, 100);
  }

  updateChart(): void {
    if (!this.chartCanvas) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const chartConfig: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: this.curvePoints.map(p => p.velocity.toFixed(0)),
        datasets: [{
          label: 'Aceleração (m/s²)',
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
            text: 'Curva de Aceleração por Velocidade',
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
                  `Velocidade: ${velocity.toFixed(1)} km/h`,
                  `Aceleração: ${acceleration.toFixed(6)} m/s²`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Velocidade (km/h)'
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
              text: 'Aceleração (m/s²)'
            },
            beginAtZero: true
          }
        }
      }
    };

    this.chart = new Chart(ctx, chartConfig);
  }

  exportToCSV(): void {
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

  resetForm(): void {
    this.curveForm.reset({
      linearVelocityThreshold: 30,
      initialAcceleration: 1.1,
      velocityIncrement: 1,
      lossFactor: 46,
      maxVelocity: 160
    });
  }
}