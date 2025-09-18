import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface StationDto {
  name: string;
  km: number;
}

export interface SimulationParamsDto {
  initialAcceleration: number;
  thresholdVelocity: number;
  maxVelocity: number;
  dwellTime: number;
  terminalLayover: number;
  stations: StationDto[];
}

export interface ScheduleEntryDto {
  station: string;
  arrivalTime: number;
  departureTime: number;
}

export interface SimulationResultDto {
  id: string;
  params: SimulationParamsDto;
  results?: {
    time: number[];
    position: number[];
    velocity: number[];
    schedule: ScheduleEntryDto[];
  };
  status: string;
  error?: string;
  createdAt: Date;
}

export interface CreateSimulationDto {
  params: SimulationParamsDto;
}

export interface PaginatedSimulationsDto {
  data: SimulationResultDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createSimulation(params: SimulationParamsDto): Observable<{ id: string; status: string }> {
    const createDto: CreateSimulationDto = { params };
    return this.http.post<{ id: string; status: string }>(`${this.apiUrl}/simulation`, createDto);
  }

  getSimulation(id: string): Observable<SimulationResultDto> {
    return this.http.get<SimulationResultDto>(`${this.apiUrl}/simulation/${id}`);
  }

  getSimulations(page: number = 1, limit: number = 10): Observable<PaginatedSimulationsDto> {
    return this.http.get<PaginatedSimulationsDto>(`${this.apiUrl}/simulation`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }
}