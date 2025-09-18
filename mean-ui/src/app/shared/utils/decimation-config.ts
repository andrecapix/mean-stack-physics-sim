/**
 * Configuração para decimação regime-aware
 * Define tolerâncias, orçamentos e políticas de exibição
 */

export interface DecimationConfig {
  // Orçamento de pontos
  maxPointsForDisplay: number;  // 1000-1500 total
  anchorReserveRatio: number;   // 0.2 (20% para âncoras)

  // Tolerâncias de regime (multiplicadores)
  velocityEpsilonRatio: number; // 1e-3 (* max_speed)
  accelEpsilonRatio: number;    // 1e-3 (* max_accel)

  // Keep-alive em regimes quietos
  keepAliveInterval: number;    // 30-60 segundos

  // Janelas de transição
  transitionBuffer: number;     // 3 pontos antes/depois

  // Limiares de regime
  cruiseVelocityRatio: number;  // 0.95 (* max_speed)
  staticVelocityThreshold: number; // 0.1 m/s (parado)
}

export const DEFAULT_DECIMATION_CONFIG: DecimationConfig = {
  maxPointsForDisplay: 1200,
  anchorReserveRatio: 0.2,
  velocityEpsilonRatio: 1e-3,
  accelEpsilonRatio: 1e-3,
  keepAliveInterval: 45,
  transitionBuffer: 3,
  cruiseVelocityRatio: 0.95,
  staticVelocityThreshold: 0.1
};

export interface SimulationEvent {
  timestamp: number;
  type: 'arrival' | 'departure' | 'accel_start' | 'accel_end' | 'cruise_start' | 'cruise_end' | 'stop_start' | 'stop_end';
  station?: string;
  value?: number;
}

export interface SegmentInfo {
  startIdx: number;
  endIdx: number;
  regime: 'static' | 'cruise' | 'transition';
  complexity: number;
  duration: number;
}

export interface BudgetAllocation {
  totalBudget: number;
  anchorBudget: number;
  dynamicBudget: number;
  segmentBudgets: number[];
}