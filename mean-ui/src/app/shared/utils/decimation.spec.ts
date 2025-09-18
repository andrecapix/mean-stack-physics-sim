/**
 * Testes de regressão para decimação regime-aware
 * Valida preservação de eventos, erro de distância e continuidade temporal
 */

import { RegimeAwareDecimation } from './regime-aware-decimation';
import { EventDetector, ScheduleEntry, SimulationParams } from './event-detector';
import { AnchorPreserver } from './anchor-preserver';
import { DEFAULT_DECIMATION_CONFIG, DecimationConfig } from './decimation-config';
import { DataDecimation } from './data-decimation';

describe('RegimeAwareDecimation', () => {

  // Mock data generators
  function generateMockSimulationData(scenarios: 'simple' | 'complex' | 'long_layover') {
    let timeArray: number[];
    let positionArray: number[];
    let velocityArray: number[];
    let schedule: ScheduleEntry[];
    let params: SimulationParams;

    switch (scenarios) {
      case 'simple':
        // 2 estações, 50km, viagem simples
        timeArray = Array.from({length: 1000}, (_, i) => i * 0.5); // 500s total
        positionArray = timeArray.map(t => {
          if (t < 100) return t * t * 0.25; // Aceleração
          if (t < 400) return 2500 + (t - 100) * 25; // Cruzeiro 25m/s
          return 10000 - (500 - t) * (500 - t) * 0.25; // Frenagem
        });
        velocityArray = timeArray.map(t => {
          if (t < 100) return t * 0.5; // Acelerando até 50m/s
          if (t < 400) return 25; // Cruzeiro
          return (500 - t) * 0.5; // Frenando
        });
        schedule = [
          {station: 'B', arrival_time: 480, departure_time: 520}
        ];
        params = {max_speed: 25, initial_accel: 0.5};
        break;

      case 'complex':
        // 4 estações, múltiplos regimes
        timeArray = Array.from({length: 2000}, (_, i) => i * 0.2); // 400s total
        positionArray = timeArray.map(t => Math.min(t * 100, 25000)); // Linear até 25km
        velocityArray = timeArray.map(t => {
          const cycle = t % 100;
          if (cycle < 20) return cycle; // Aceleração
          if (cycle < 60) return 20; // Cruzeiro
          if (cycle < 80) return 20 - (cycle - 60); // Frenagem
          return 0; // Parado
        });
        schedule = [
          {station: 'B', arrival_time: 80, departure_time: 120},
          {station: 'C', arrival_time: 180, departure_time: 220},
          {station: 'D', arrival_time: 280, departure_time: 320}
        ];
        params = {max_speed: 20, initial_accel: 1.0};
        break;

      case 'long_layover':
        // Layover longo para testar keep-alive
        timeArray = Array.from({length: 1500}, (_, i) => i); // 1500s
        positionArray = timeArray.map(t => {
          if (t < 200) return t * 50; // Ida
          if (t < 1300) return 10000; // Layover longo
          return 10000 + (t - 1300) * 50; // Volta
        });
        velocityArray = timeArray.map(t => {
          if (t < 200) return 20;
          if (t < 1300) return 0; // Parado por 1100s
          return 20;
        });
        schedule = [
          {station: 'Terminal', arrival_time: 200, departure_time: 1300}
        ];
        params = {max_speed: 20, initial_accel: 2.0};
        break;
    }

    return {timeArray, positionArray, velocityArray, schedule, params};
  }

  function integrateVelocity(timeArray: number[], velocityArray: number[]): number {
    let distance = 0;
    for (let i = 1; i < timeArray.length; i++) {
      const dt = timeArray[i] - timeArray[i - 1];
      const avgVel = (velocityArray[i] + velocityArray[i - 1]) / 2;
      distance += avgVel * dt;
    }
    return distance;
  }

  describe('Event Preservation', () => {
    it('should preserve all station arrivals and departures', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('complex');

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      // Verificar que todos os timestamps de eventos estão presentes
      schedule.forEach(entry => {
        const hasArrival = result.time.some(t => Math.abs(t - entry.arrival_time) < 1.0);
        const hasDeparture = result.time.some(t => Math.abs(t - entry.departure_time) < 1.0);

        expect(hasArrival).toBeTruthy(`Arrival time ${entry.arrival_time} for station ${entry.station} should be preserved`);
        expect(hasDeparture).toBeTruthy(`Departure time ${entry.departure_time} for station ${entry.station} should be preserved`);
      });
    });

    it('should preserve start and end points', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('simple');

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      expect(result.time[0]).toBe(timeArray[0]);
      expect(result.time[result.time.length - 1]).toBe(timeArray[timeArray.length - 1]);
    });
  });

  describe('Distance Accuracy', () => {
    it('should maintain travel distance within 0.1% error', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('simple');

      const originalDistance = integrateVelocity(timeArray, velocityArray);

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      const decimatedDistance = integrateVelocity(result.time, result.values);
      const relativeError = Math.abs(originalDistance - decimatedDistance) / originalDistance;

      expect(relativeError).toBeLessThan(0.001); // 0.1%
      expect(originalDistance).toBeGreaterThan(0); // Sanity check
    });

    it('should handle complex velocity profiles accurately', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('complex');

      const originalDistance = integrateVelocity(timeArray, velocityArray);

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      const decimatedDistance = integrateVelocity(result.time, result.values);
      const relativeError = Math.abs(originalDistance - decimatedDistance) / originalDistance;

      expect(relativeError).toBeLessThan(0.002); // 0.2% for complex profiles
    });
  });

  describe('Temporal Continuity', () => {
    it('should not create artificial time gaps', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('simple');

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      const timeDeltas = result.time.slice(1).map((t, i) => t - result.time[i]);
      const maxGap = Math.max(...timeDeltas);

      // Gap máximo deve ser razoável (considerando que dwell pode criar gaps legítimos)
      expect(maxGap).toBeLessThan(120); // 2 minutos máximo
      expect(timeDeltas.every(dt => dt > 0)).toBeTruthy(); // Ordem crescente
    });

    it('should handle long static periods efficiently', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('long_layover');

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, {
          ...DEFAULT_DECIMATION_CONFIG,
          keepAliveInterval: 60 // Keep-alive a cada 60s
        }
      );

      // Verificar que período estático foi simplificado mas mantém keep-alive
      const staticPeriod = result.time.filter(t => t >= 200 && t <= 1300);

      // Deve ter alguns pontos de keep-alive, mas muito menos que os originais
      expect(staticPeriod.length).toBeGreaterThan(5); // Pelo menos alguns keep-alive
      expect(staticPeriod.length).toBeLessThan(50); // Muito menos que os 1100 originais
    });
  });

  describe('Budget Allocation', () => {
    it('should respect maximum points budget', () => {
      const {timeArray, positionArray, velocityArray, schedule, params} =
        generateMockSimulationData('complex');

      const maxPoints = 500;
      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, {
          ...DEFAULT_DECIMATION_CONFIG,
          maxPointsForDisplay: maxPoints
        }
      );

      expect(result.time.length).toBeLessThanOrEqual(maxPoints * 1.1); // 10% tolerance
    });

    it('should adapt budget based on data complexity', () => {
      const simple = generateMockSimulationData('simple');
      const complex = generateMockSimulationData('complex');

      const maxPoints = 800;
      const config = {...DEFAULT_DECIMATION_CONFIG, maxPointsForDisplay: maxPoints};

      const simpleResult = RegimeAwareDecimation.decimate(
        simple.timeArray, simple.velocityArray, simple.schedule, simple.params, config
      );

      const complexResult = RegimeAwareDecimation.decimate(
        complex.timeArray, complex.velocityArray, complex.schedule, complex.params, config
      );

      // Dados complexos devem usar mais pontos para preservar detalhes
      expect(complexResult.time.length).toBeGreaterThan(simpleResult.time.length * 0.8);
    });
  });

  describe('Regime-Specific Decimation', () => {
    it('should simplify static regimes aggressively', () => {
      const timeArray = Array.from({length: 1000}, (_, i) => i);
      const velocityArray = Array.from({length: 1000}, () => 0); // Tudo parado
      const schedule: ScheduleEntry[] = [];
      const params: SimulationParams = {max_speed: 20, initial_accel: 1};

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      // Regime totalmente estático deve ser reduzido drasticamente
      expect(result.time.length).toBeLessThan(50); // Muito poucos pontos
      expect(result.time[0]).toBe(0); // Primeiro ponto preservado
      expect(result.time[result.time.length - 1]).toBe(999); // Último ponto preservado
    });

    it('should preserve detail in transition regimes', () => {
      // Criar dados com muitas transições
      const timeArray = Array.from({length: 400}, (_, i) => i * 0.5);
      const velocityArray = timeArray.map(t => Math.sin(t * 0.1) * 10 + 10); // Oscilações
      const schedule: ScheduleEntry[] = [];
      const params: SimulationParams = {max_speed: 20, initial_accel: 2};

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, schedule, params, DEFAULT_DECIMATION_CONFIG
      );

      // Transições complexas devem manter mais pontos
      const reductionRatio = result.time.length / timeArray.length;
      expect(reductionRatio).toBeGreaterThan(0.3); // Pelo menos 30% dos pontos preservados
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const result = RegimeAwareDecimation.decimate(
        [], [], [], {max_speed: 20, initial_accel: 1}, DEFAULT_DECIMATION_CONFIG
      );

      expect(result.time).toEqual([]);
      expect(result.values).toEqual([]);
    });

    it('should handle single point data', () => {
      const result = RegimeAwareDecimation.decimate(
        [0], [10], [], {max_speed: 20, initial_accel: 1}, DEFAULT_DECIMATION_CONFIG
      );

      expect(result.time).toEqual([0]);
      expect(result.values).toEqual([10]);
    });

    it('should handle data smaller than budget', () => {
      const timeArray = [0, 1, 2, 3, 4];
      const velocityArray = [0, 5, 10, 5, 0];

      const result = RegimeAwareDecimation.decimate(
        timeArray, velocityArray, [], {max_speed: 20, initial_accel: 1},
        {...DEFAULT_DECIMATION_CONFIG, maxPointsForDisplay: 1000}
      );

      // Deve retornar todos os pontos quando menor que o orçamento
      expect(result.time).toEqual(timeArray);
      expect(result.values).toEqual(velocityArray);
    });
  });
});