import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { AccelerationCurveConfig, AccelerationCurvePoint, AccelerationCurveData } from './acceleration-curve.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccelerationCurveService {
  private apiUrl = `${environment.apiUrl}/acceleration-curve`;

  constructor(private http: HttpClient) {}

  calculateAccelerationCurve(config: AccelerationCurveConfig): AccelerationCurvePoint[] {
    const points: AccelerationCurvePoint[] = [];
    let currentAcceleration = config.initialAcceleration;

    for (let velocity = 0; velocity <= config.maxVelocity; velocity += config.velocityIncrement) {
      if (velocity <= config.linearVelocityThreshold) {
        // Aceleração constante até a velocidade linear
        currentAcceleration = config.initialAcceleration;
      } else {
        // Após a velocidade linear, a aceleração decai
        // A1 = A0 - (A0/lossFactor)
        currentAcceleration = currentAcceleration - (currentAcceleration / config.lossFactor);
      }

      points.push({
        velocity: velocity,
        acceleration: currentAcceleration
      });
    }

    return points;
  }

  exportToCSV(points: AccelerationCurvePoint[]): string {
    let csvContent = 'Velocidade (km/h),Aceleracao (m/s2)\n';

    points.forEach(point => {
      csvContent += `${point.velocity.toFixed(1)},${point.acceleration.toFixed(6)}\n`;
    });

    return csvContent;
  }

  saveCurveConfiguration(config: AccelerationCurveConfig): Observable<AccelerationCurveData> {
    const points = this.calculateAccelerationCurve(config);
    const curveData: AccelerationCurveData = {
      config,
      points,
      createdAt: new Date()
    };

    // Usa o endpoint real do NestJS agora que está implementado
    return this.http.post<AccelerationCurveData>(`${this.apiUrl}/save`, {
      name: `Curve_${new Date().toISOString()}`,
      ...config
    });
  }

  getCurveConfigurations(): Observable<AccelerationCurveData[]> {
    // Por enquanto, retorna um Observable vazio
    // Quando o backend estiver pronto, substituir por:
    // return this.http.get<AccelerationCurveData[]>(`${this.apiUrl}/list`);

    return of([]);
  }

  getCurveConfigurationById(id: string): Observable<AccelerationCurveData> {
    // Por enquanto, retorna um Observable mock
    // Quando o backend estiver pronto, substituir por:
    // return this.http.get<AccelerationCurveData>(`${this.apiUrl}/${id}`);

    const mockConfig: AccelerationCurveConfig = {
      linearVelocityThreshold: 30,
      initialAcceleration: 1.1,
      velocityIncrement: 1,
      lossFactor: 46,
      maxVelocity: 160
    };

    return of({
      config: mockConfig,
      points: this.calculateAccelerationCurve(mockConfig),
      id: id,
      createdAt: new Date()
    });
  }

  calculateCurveOnBackend(config: AccelerationCurveConfig): Observable<AccelerationCurvePoint[]> {
    // Quando o backend estiver pronto, substituir por:
    // return this.http.post<AccelerationCurvePoint[]>(`${this.apiUrl}/calculate`, config);

    return of(this.calculateAccelerationCurve(config));
  }
}