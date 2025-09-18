import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HistoryComponent } from './history.component';
import { SimulationService } from '../../../core/services/simulation.service';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let mockSimulationService: jasmine.SpyObj<SimulationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockActivatedRoute: any;

  const mockSimulations = [
    {
      id: '1',
      params: {
        stations: [{ name: 'Estação A', km: 0 }, { name: 'Estação B', km: 10 }],
        maxVelocity: 30,
        initialAcceleration: 2,
        thresholdVelocity: 20,
        dwellTime: 30,
        terminalLayover: 300
      },
      status: 'completed' as const,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      results: {
        time: [0, 100, 200],
        position: [0, 5, 10],
        velocity: [0, 30, 0],
        schedule: []
      }
    },
    {
      id: '2',
      params: {
        stations: [{ name: 'Estação C', km: 0 }, { name: 'Estação D', km: 15 }],
        maxVelocity: 25,
        initialAcceleration: 1.5,
        thresholdVelocity: 18,
        dwellTime: 45,
        terminalLayover: 240
      },
      status: 'failed' as const,
      createdAt: new Date('2024-01-14T15:30:00Z')
    }
  ];

  beforeEach(async () => {
    const simulationSpy = jasmine.createSpyObj('SimulationService', ['getSimulations']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockActivatedRoute = { snapshot: { queryParams: {} } };

    await TestBed.configureTestingModule({
      imports: [HistoryComponent, NoopAnimationsModule],
      providers: [
        { provide: SimulationService, useValue: simulationSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    mockSimulationService = TestBed.inject(SimulationService) as jasmine.SpyObj<SimulationService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Setup default return values
    mockSimulationService.getSimulations.and.returnValue(of({
      data: mockSimulations,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    }));

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.isLoading()).toBe(true);
  });

  it('should load simulations on init', () => {
    component.ngOnInit();
    expect(mockSimulationService.getSimulations).toHaveBeenCalled();
  });

  it('should navigate to simulation details', () => {
    component.viewSimulation('sim-123');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/simulation', 'sim-123']);
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('15/01/2024');
  });

  it('should get correct status icon', () => {
    expect(component.getStatusIcon('completed')).toBe('check_circle');
    expect(component.getStatusIcon('failed')).toBe('error');
    expect(component.getStatusIcon('processing')).toBe('hourglass_empty');
  });

  it('should handle pagination change', () => {
    const event = { pageIndex: 1, pageSize: 10, length: 20 };
    component.onPageChange(event);

    expect(component.currentPage()).toBe(2);
    expect(component.pageSize()).toBe(10);
  });

  it('should clear filters', () => {
    component.searchControl.setValue('test');
    component.statusControl.setValue(['completed']);

    component.clearFilters();

    expect(component.searchControl.value).toBe('');
    expect(component.statusControl.value).toEqual([]);
  });

  it('should handle empty results', () => {
    mockSimulationService.getSimulations.and.returnValue(of({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }));

    component.ngOnInit();

    expect(component.simulations()).toEqual([]);
    expect(component.totalResults()).toBe(0);
  });
});