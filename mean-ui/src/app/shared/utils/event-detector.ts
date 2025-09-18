/**
 * Detector de eventos e transições de regime
 * Identifica momentos críticos que devem ser preservados na decimação
 */

import { SimulationEvent, DecimationConfig } from './decimation-config';

export interface ScheduleEntry {
  station: string;
  arrival_time: number;
  departure_time: number;
}

export interface SimulationParams {
  max_speed: number;
  initial_accel: number;
}

export class EventDetector {
  /**
   * Detecta todos os eventos críticos que devem ser preservados
   */
  static detectEvents(
    timeArray: number[],
    positionArray: number[],
    velocityArray: number[],
    schedule: ScheduleEntry[],
    params: SimulationParams,
    config: DecimationConfig
  ): SimulationEvent[] {

    const events: SimulationEvent[] = [];
    const εv = params.max_speed * config.velocityEpsilonRatio;
    const εa = params.initial_accel * config.accelEpsilonRatio;
    const cruiseThreshold = params.max_speed * config.cruiseVelocityRatio;

    // 1. Eventos de cronograma (âncoras obrigatórias)
    schedule.forEach(entry => {
      events.push({
        timestamp: entry.arrival_time,
        type: 'arrival',
        station: entry.station
      });

      events.push({
        timestamp: entry.departure_time,
        type: 'departure',
        station: entry.station
      });
    });

    // 2. Detectar transições de regime dinâmico
    let inCruise = false;
    let inStop = false;
    let significantAccel = false;

    for (let i = 1; i < velocityArray.length - 1; i++) {
      const prevVel = velocityArray[i - 1];
      const currVel = velocityArray[i];
      const nextVel = velocityArray[i + 1];

      // Aproximação da aceleração
      const dt = timeArray[i] - timeArray[i - 1];
      if (dt > 0) {
        const acceleration = (currVel - prevVel) / dt;

        // Detectar início/fim de aceleração significativa
        const hasSignificantAccel = Math.abs(acceleration) > εa;

        if (hasSignificantAccel && !significantAccel) {
          events.push({
            timestamp: timeArray[i],
            type: 'accel_start',
            value: acceleration
          });
          significantAccel = true;
        } else if (!hasSignificantAccel && significantAccel) {
          events.push({
            timestamp: timeArray[i],
            type: 'accel_end',
            value: acceleration
          });
          significantAccel = false;
        }

        // Detectar entrada/saída de cruzeiro
        const isInCruise = currVel > cruiseThreshold && Math.abs(acceleration) < εa;

        if (isInCruise && !inCruise) {
          events.push({
            timestamp: timeArray[i],
            type: 'cruise_start'
          });
          inCruise = true;
        } else if (!isInCruise && inCruise) {
          events.push({
            timestamp: timeArray[i],
            type: 'cruise_end'
          });
          inCruise = false;
        }

        // Detectar entrada/saída de parada
        const isStopped = currVel < config.staticVelocityThreshold;

        if (isStopped && !inStop) {
          events.push({
            timestamp: timeArray[i],
            type: 'stop_start'
          });
          inStop = true;
        } else if (!isStopped && inStop) {
          events.push({
            timestamp: timeArray[i],
            type: 'stop_end'
          });
          inStop = false;
        }
      }
    }

    // Ordenar eventos por timestamp
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Calcula complexidade de um segmento baseado em mudanças de aceleração
   */
  static calculateComplexity(
    timeArray: number[],
    velocityArray: number[],
    startIdx: number,
    endIdx: number
  ): number {
    let complexity = 0;

    for (let i = startIdx + 1; i < endIdx && i < velocityArray.length; i++) {
      const dt = timeArray[i] - timeArray[i - 1];
      if (dt > 0) {
        const accel = (velocityArray[i] - velocityArray[i - 1]) / dt;
        complexity += Math.abs(accel) * dt;
      }
    }

    return complexity;
  }

  /**
   * Identifica extremos locais (picos e vales) que devem ser preservados
   */
  static findLocalExtremes(
    values: number[],
    windowSize: number = 5
  ): number[] {
    const extremes: number[] = [];

    for (let i = windowSize; i < values.length - windowSize; i++) {
      let isMaximum = true;
      let isMinimum = true;

      // Verificar janela ao redor do ponto
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i) {
          if (values[j] >= values[i]) isMaximum = false;
          if (values[j] <= values[i]) isMinimum = false;
        }
      }

      if (isMaximum || isMinimum) {
        extremes.push(i);
      }
    }

    return extremes;
  }

  /**
   * Encontra períodos prolongados com regime constante
   */
  static findConstantRegimePeriods(
    velocityArray: number[],
    timeArray: number[],
    config: DecimationConfig
  ): Array<{start: number, end: number, type: 'static' | 'cruise'}> {

    const periods: Array<{start: number, end: number, type: 'static' | 'cruise'}> = [];
    let currentPeriod: {start: number, type: 'static' | 'cruise'} | null = null;

    for (let i = 0; i < velocityArray.length; i++) {
      const vel = velocityArray[i];
      let regime: 'static' | 'cruise' | 'transition';

      if (vel < config.staticVelocityThreshold) {
        regime = 'static';
      } else if (vel > 20 * config.cruiseVelocityRatio) { // Aproximação para cruzeiro
        regime = 'cruise';
      } else {
        regime = 'transition';
      }

      if (regime !== 'transition') {
        if (!currentPeriod || currentPeriod.type !== regime) {
          // Fechar período anterior se existir
          if (currentPeriod) {
            periods.push({
              start: currentPeriod.start,
              end: i - 1,
              type: currentPeriod.type
            });
          }

          // Iniciar novo período
          currentPeriod = { start: i, type: regime };
        }
      } else {
        // Fechar período atual se estiver em transição
        if (currentPeriod) {
          periods.push({
            start: currentPeriod.start,
            end: i - 1,
            type: currentPeriod.type
          });
          currentPeriod = null;
        }
      }
    }

    // Fechar último período se existir
    if (currentPeriod) {
      periods.push({
        start: currentPeriod.start,
        end: velocityArray.length - 1,
        type: currentPeriod.type
      });
    }

    // Filtrar períodos muito curtos
    return periods.filter(period => {
      const duration = timeArray[period.end] - timeArray[period.start];
      return duration > 5; // Pelo menos 5 segundos
    });
  }
}