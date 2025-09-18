/**
 * Decimação Regime-Aware - lógica principal de decimação inteligente
 * Aplica diferentes estratégias baseadas no regime operacional do trem
 */

import { DataPoint, DataDecimation } from './data-decimation';
import { EventDetector, ScheduleEntry, SimulationParams } from './event-detector';
import { AnchorPreserver } from './anchor-preserver';
import {
  DecimationConfig,
  DEFAULT_DECIMATION_CONFIG,
  SimulationEvent,
  SegmentInfo,
  BudgetAllocation
} from './decimation-config';

export class RegimeAwareDecimation {
  /**
   * Decimação principal com consciência de regime
   */
  static decimate(
    timeArray: number[],
    valueArray: number[],
    schedule: ScheduleEntry[],
    params: SimulationParams,
    config: DecimationConfig = DEFAULT_DECIMATION_CONFIG
  ): { time: number[], values: number[] } {

    // 1. Converter para DataPoints
    const dataPoints = DataDecimation.arrayToDataPoints(timeArray, valueArray);

    // 2. Detectar eventos críticos
    const events = EventDetector.detectEvents(
      timeArray, timeArray, valueArray, schedule, params, config
    );

    // 3. Identificar segmentos entre eventos
    const segments = this.identifySegments(timeArray, valueArray, events, config);

    // 4. Calcular orçamento por segmento
    const budgetAllocation = this.calculateBudgetAllocation(segments, config);

    // 5. Preservar âncoras obrigatórias
    const anchorIndices = AnchorPreserver.preserveAnchors(dataPoints, events, config);

    // 6. Aplicar decimação por segmento
    const decimatedPoints = this.decimateBySegments(
      dataPoints, segments, budgetAllocation, anchorIndices, config
    );

    // 7. Garantir que todas as âncoras estão presentes
    const finalPoints = AnchorPreserver.forceIncludeAnchors(
      dataPoints, decimatedPoints, anchorIndices
    );

    // 8. Converter de volta para arrays
    const result = DataDecimation.dataPointsToArrays(finalPoints);
    return {
      time: result.x,
      values: result.y
    };
  }

  /**
   * Identifica segmentos operacionais baseados em eventos
   */
  private static identifySegments(
    timeArray: number[],
    valueArray: number[],
    events: SimulationEvent[],
    config: DecimationConfig
  ): SegmentInfo[] {

    const segments: SegmentInfo[] = [];

    // Pontos de divisão baseados em eventos de transição
    const transitionPoints = events
      .filter(e => ['accel_start', 'accel_end', 'cruise_start', 'cruise_end', 'stop_start', 'stop_end'].includes(e.type))
      .map(e => this.findTimeIndex(timeArray, e.timestamp))
      .sort((a, b) => a - b);

    // Adicionar início e fim
    const divisionPoints = [0, ...transitionPoints, timeArray.length - 1];

    // Criar segmentos
    for (let i = 0; i < divisionPoints.length - 1; i++) {
      const startIdx = divisionPoints[i];
      const endIdx = divisionPoints[i + 1];

      if (endIdx > startIdx) {
        const regime = this.classifySegmentRegime(valueArray, startIdx, endIdx, config);
        const complexity = EventDetector.calculateComplexity(timeArray, valueArray, startIdx, endIdx);
        const duration = timeArray[endIdx] - timeArray[startIdx];

        segments.push({
          startIdx,
          endIdx,
          regime,
          complexity,
          duration
        });
      }
    }

    return segments;
  }

  /**
   * Classifica o regime de um segmento
   */
  private static classifySegmentRegime(
    valueArray: number[],
    startIdx: number,
    endIdx: number,
    config: DecimationConfig
  ): 'static' | 'cruise' | 'transition' {

    const segmentValues = valueArray.slice(startIdx, endIdx + 1);
    const avgVelocity = segmentValues.reduce((sum, v) => sum + v, 0) / segmentValues.length;
    const maxVelocity = Math.max(...segmentValues);
    const velocityVariance = this.calculateVariance(segmentValues);

    // Regime estático: velocidade baixa e pouca variação
    if (maxVelocity < config.staticVelocityThreshold * 2 && velocityVariance < 1.0) {
      return 'static';
    }

    // Regime de cruzeiro: velocidade alta e estável
    if (avgVelocity > 15 && velocityVariance < 4.0) { // Aproximação para cruzeiro
      return 'cruise';
    }

    // Caso contrário, é transição
    return 'transition';
  }

  /**
   * Calcula alocação de orçamento por segmento
   */
  private static calculateBudgetAllocation(
    segments: SegmentInfo[],
    config: DecimationConfig
  ): BudgetAllocation {

    const totalBudget = config.maxPointsForDisplay;
    const anchorBudget = Math.floor(totalBudget * config.anchorReserveRatio);
    const dynamicBudget = totalBudget - anchorBudget;

    // Calcular complexidade total
    const totalComplexity = segments.reduce((sum, seg) =>
      seg.regime === 'transition' ? sum + seg.complexity + seg.duration * 0.1 : sum + seg.duration * 0.01, 0
    );

    // Distribuir orçamento proporcionalmente
    const segmentBudgets = segments.map(segment => {
      if (segment.regime === 'static') {
        return Math.max(2, Math.floor(segment.duration / config.keepAliveInterval) + 2);
      } else if (segment.regime === 'cruise') {
        return Math.max(3, Math.floor(segment.duration / (config.keepAliveInterval * 0.5)) + 2);
      } else {
        // Transição: orçamento baseado em complexidade
        const segmentWeight = (segment.complexity + segment.duration * 0.1) / totalComplexity;
        return Math.max(10, Math.floor(segmentWeight * dynamicBudget * 0.8));
      }
    });

    return {
      totalBudget,
      anchorBudget,
      dynamicBudget,
      segmentBudgets
    };
  }

  /**
   * Aplica decimação específica por segmento
   */
  private static decimateBySegments(
    dataPoints: DataPoint[],
    segments: SegmentInfo[],
    budgetAllocation: BudgetAllocation,
    anchorIndices: number[],
    config: DecimationConfig
  ): DataPoint[] {

    const decimatedPoints: DataPoint[] = [];
    const anchorSet = new Set(anchorIndices);

    segments.forEach((segment, segmentIndex) => {
      const segmentData = dataPoints.slice(segment.startIdx, segment.endIdx + 1);
      const segmentBudget = budgetAllocation.segmentBudgets[segmentIndex];

      // Identificar âncoras neste segmento
      const segmentAnchors = anchorIndices.filter(idx =>
        idx >= segment.startIdx && idx <= segment.endIdx
      ).map(idx => idx - segment.startIdx);

      let segmentResult: DataPoint[];

      if (segment.regime === 'static') {
        // Regime estático: apenas início, fim e keep-alive
        segmentResult = this.decimateStaticSegment(segmentData, segmentBudget, config);
      } else if (segment.regime === 'cruise') {
        // Regime de cruzeiro: pontos esparsos com keep-alive
        segmentResult = this.decimateCruiseSegment(segmentData, segmentBudget, config);
      } else {
        // Regime de transição: aplicar LTTB com densidade alta
        segmentResult = this.decimateTransitionSegment(segmentData, segmentBudget, segmentAnchors);
      }

      // Garantir que âncoras do segmento estão incluídas
      segmentAnchors.forEach(anchorIdx => {
        if (anchorIdx < segmentData.length) {
          const anchor = segmentData[anchorIdx];
          if (!segmentResult.some(p => Math.abs(p.x - anchor.x) < 0.001)) {
            segmentResult.push(anchor);
          }
        }
      });

      // Reordenar e adicionar ao resultado
      segmentResult.sort((a, b) => a.x - b.x);
      decimatedPoints.push(...segmentResult);
    });

    // Remover duplicatas baseadas em timestamp
    const uniquePoints = this.removeDuplicatesByTime(decimatedPoints);
    return uniquePoints.sort((a, b) => a.x - b.x);
  }

  /**
   * Decimação para segmentos estáticos (parados)
   */
  private static decimateStaticSegment(
    segmentData: DataPoint[],
    budget: number,
    config: DecimationConfig
  ): DataPoint[] {

    if (segmentData.length <= 2) return segmentData;

    const result: DataPoint[] = [];

    // Sempre incluir primeiro e último
    result.push(segmentData[0]);

    // Adicionar pontos keep-alive se o segmento for longo
    if (segmentData.length > 10 && budget > 2) {
      const interval = Math.floor(segmentData.length / (budget - 2));
      for (let i = interval; i < segmentData.length - 1; i += interval) {
        result.push(segmentData[i]);
      }
    }

    result.push(segmentData[segmentData.length - 1]);

    return result;
  }

  /**
   * Decimação para segmentos de cruzeiro
   */
  private static decimateCruiseSegment(
    segmentData: DataPoint[],
    budget: number,
    config: DecimationConfig
  ): DataPoint[] {

    if (segmentData.length <= budget) return segmentData;

    // Para cruzeiro, usar amostragem uniforme com densidade média
    const interval = Math.floor(segmentData.length / budget);
    const result: DataPoint[] = [];

    for (let i = 0; i < segmentData.length; i += interval) {
      result.push(segmentData[i]);
    }

    // Garantir último ponto
    if (result[result.length - 1] !== segmentData[segmentData.length - 1]) {
      result.push(segmentData[segmentData.length - 1]);
    }

    return result;
  }

  /**
   * Decimação para segmentos de transição (usando LTTB)
   */
  private static decimateTransitionSegment(
    segmentData: DataPoint[],
    budget: number,
    anchorIndices: number[]
  ): DataPoint[] {

    if (segmentData.length <= budget) return segmentData;

    // Aplicar LTTB com orçamento ajustado
    return DataDecimation.applyLTTB(segmentData, budget);
  }

  // Métodos utilitários

  private static findTimeIndex(timeArray: number[], targetTime: number): number {
    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < timeArray.length; i++) {
      const distance = Math.abs(timeArray[i] - targetTime);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
  }

  private static removeDuplicatesByTime(points: DataPoint[]): DataPoint[] {
    const seen = new Set<number>();
    return points.filter(point => {
      // Arredondar timestamp para evitar duplicatas por precisão de float
      const roundedTime = Math.round(point.x * 1000) / 1000;
      if (seen.has(roundedTime)) {
        return false;
      }
      seen.add(roundedTime);
      return true;
    });
  }
}