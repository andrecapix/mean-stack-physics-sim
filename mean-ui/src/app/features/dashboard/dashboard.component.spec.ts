import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { SimulationService } from '../../core/services/simulation.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSimulationService: jasmine.SpyObj<SimulationService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create spies
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout', 'isAdmin'], {
      currentUser: signal({ id: '1', name: 'Test User', email: 'test@example.com', role: 'user' })
    });
    mockSimulationService = jasmine.createSpyObj('SimulationService', ['getSimulations']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Setup default return values
    mockAuthService.isAdmin.and.returnValue(false);
    mockAuthService.logout.and.returnValue(of(void 0));
    mockSimulationService.getSimulations.and.returnValue(of({
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0
    }));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: SimulationService, useValue: mockSimulationService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading states', () => {
    expect(component.isLoadingMetrics()).toBe(true);
    expect(component.isLoadingRecent()).toBe(true);
  });

  it('should load dashboard data on init', () => {
    component.ngOnInit();
    expect(mockSimulationService.getSimulations).toHaveBeenCalledTimes(2);
  });

  it('should navigate to simulation page', () => {
    component.goToSimulation();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/simulation']);
  });

  it('should navigate to history page', () => {
    component.viewAllSimulations();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/simulation/history']);
  });

  it('should format relative time correctly', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    expect(component.formatRelativeTime(fiveMinutesAgo)).toBe('5min atrás');
    expect(component.formatRelativeTime(twoHoursAgo)).toBe('2h atrás');
    expect(component.formatRelativeTime(threeDaysAgo)).toBe('3d atrás');
  });

  it('should calculate metrics correctly', () => {
    const mockSimulations = [
      {
        id: '1',
        status: 'completed',
        results: { time: new Array(1000), position: [], velocity: [], schedule: [] },
        params: { stations: [], maxVelocity: 30, initialAcceleration: 2, thresholdVelocity: 20, dwellTime: 30, terminalLayover: 300 },
        createdAt: new Date()
      },
      {
        id: '2',
        status: 'failed',
        results: undefined,
        params: { stations: [], maxVelocity: 30, initialAcceleration: 2, thresholdVelocity: 20, dwellTime: 30, terminalLayover: 300 },
        createdAt: new Date()
      }
    ];

    mockSimulationService.getSimulations.and.returnValue(of({
      data: mockSimulations,
      total: 2,
      page: 1,
      limit: 5,
      totalPages: 1
    }));

    component.ngOnInit();

    const metrics = component.dashboardMetrics();
    expect(metrics.totalSimulations).toBe(2);
    expect(metrics.successRate).toBe(50);
  });

  it('should show admin features for admin users', () => {
    mockAuthService.isAdmin.and.returnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const adminCard = compiled.querySelector('.admin-action');
    expect(adminCard).toBeTruthy();
  });

  it('should hide admin features for regular users', () => {
    mockAuthService.isAdmin.and.returnValue(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const adminCard = compiled.querySelector('.admin-action');
    expect(adminCard).toBeFalsy();
  });

  it('should handle logout', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Logout realizado com sucesso!',
      'Fechar',
      jasmine.any(Object)
    );
  });

  it('should format simulation summary correctly', () => {
    const simulation = {
      id: '1',
      params: {
        stations: [{ name: 'A', km: 0 }, { name: 'B', km: 5 }],
        maxVelocity: 30,
        initialAcceleration: 2,
        thresholdVelocity: 20,
        dwellTime: 30,
        terminalLayover: 300
      },
      status: 'completed',
      createdAt: new Date()
    };

    const summary = component.formatSimulationSummary(simulation);
    expect(summary).toBe('2 estações, vel. máx. 30m/s');
  });

  it('should refresh dashboard data', () => {
    spyOn(component, 'loadDashboardData' as any);
    component.refreshDashboard();

    expect(component.isLoadingMetrics()).toBe(true);
    expect(component.isLoadingRecent()).toBe(true);
  });

  it('should get correct role information', () => {
    mockAuthService.isAdmin.and.returnValue(false);
    expect(component.getRoleLabel()).toBe('Usuário');
    expect(component.getRoleIcon()).toBe('person');
    expect(component.getRoleClass()).toBe('role-user');

    mockAuthService.isAdmin.and.returnValue(true);
    expect(component.getRoleLabel()).toBe('Administrador');
    expect(component.getRoleIcon()).toBe('admin_panel_settings');
    expect(component.getRoleClass()).toBe('role-admin');
  });
});