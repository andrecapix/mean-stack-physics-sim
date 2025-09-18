/**
 * Preservador de âncoras - garante que eventos críticos nunca sejam descartados
 * Implementa política de preservação obrigatória para análise operacional
 */

import { SimulationEvent, DecimationConfig } from './decimation-config';
import { DataPoint } from './data-decimation';

export class AnchorPreserver {
  /**
   * Identifica todos os índices que devem ser preservados obrigatoriamente
   */
  static preserveAnchors(
    originalData: DataPoint[],
    events: SimulationEvent[],
    config: DecimationConfig
  ): number[] {

    const anchorIndices = new Set<number>();

    // 1. SEMPRE preservar primeiro e último ponto
    anchorIndices.add(0);
    anchorIndices.add(originalData.length - 1);

    // 2. Preservar índices próximos aos eventos detectados
    events.forEach(event => {
      const nearestIndex = this.findNearestIndex(
        originalData.map(p => p.x),
        event.timestamp
      );

      // Adicionar índice do evento + buffer ao redor
      for (let i = Math.max(0, nearestIndex - config.transitionBuffer);
           i <= Math.min(originalData.length - 1, nearestIndex + config.transitionBuffer);
           i++) {
        anchorIndices.add(i);
      }
    });

    // 3. Preservar extremos locais (picos e vales de velocidade)
    const velocityData = originalData.map(p => p.y);
    const extremeIndices = this.findLocalExtremes(velocityData, 3);
    extremeIndices.forEach(idx => anchorIndices.add(idx));

    // 4. Keep-alive em regimes estáticos longos
    this.addKeepAlivePoints(originalData, anchorIndices, config);

    // Converter para array ordenado
    return Array.from(anchorIndices).sort((a, b) => a - b);
  }

  /**
   * Encontra o índice mais próximo a um timestamp específico
   */
  private static findNearestIndex(timeArray: number[], targetTime: number): number {
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

  /**
   * Identifica extremos locais (picos e vales)
   */
  private static findLocalExtremes(values: number[], windowSize: number): number[] {
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

      // Só considerar extremos significativos
      if (isMaximum || isMinimum) {
        const prominence = this.calculateProminence(values, i, windowSize * 2);
        if (prominence > 1.0) { // Pelo menos 1 m/s de diferença
          extremes.push(i);
        }
      }
    }

    return extremes;
  }

  /**
   * Calcula a proeminência de um pico/vale
   */
  private static calculateProminence(values: number[], index: number, windowSize: number): number {
    const value = values[index];
    let maxDiff = 0;

    const start = Math.max(0, index - windowSize);
    const end = Math.min(values.length - 1, index + windowSize);

    for (let i = start; i <= end; i++) {
      if (i !== index) {
        maxDiff = Math.max(maxDiff, Math.abs(value - values[i]));
      }
    }

    return maxDiff;
  }

  /**
   * Adiciona pontos keep-alive em regimes estáticos longos
   */
  private static addKeepAlivePoints(
    originalData: DataPoint[],
    anchorIndices: Set<number>,
    config: DecimationConfig
  ): void {

    // Identificar períodos de velocidade constante
    const velocityData = originalData.map(p => p.y);
    const timeData = originalData.map(p => p.x);

    let lastKeepAlive = 0;

    for (let i = 0; i < originalData.length; i++) {
      const timeSinceLastKeepAlive = timeData[i] - timeData[lastKeepAlive];

      // Se passou do intervalo de keep-alive, adicionar ponto
      if (timeSinceLastKeepAlive >= config.keepAliveInterval) {
        // Verificar se estamos em regime estático (velocidade baixa e constante)
        const isStatic = this.isStaticRegime(velocityData, i, config);

        if (isStatic) {
          anchorIndices.add(i);
          lastKeepAlive = i;
        }
      }
    }
  }

  /**
   * Verifica se um ponto está em regime estático
   */
  private static isStaticRegime(velocityData: number[], index: number, config: DecimationConfig): boolean {
    const velocity = velocityData[index];

    // Velocidade baixa
    if (velocity > config.staticVelocityThreshold * 2) {
      return false;
    }

    // Verificar estabilidade em janela ao redor
    const windowSize = 10;
    const start = Math.max(0, index - windowSize);
    const end = Math.min(velocityData.length - 1, index + windowSize);

    let maxVariation = 0;
    for (let i = start; i < end; i++) {
      maxVariation = Math.max(maxVariation, Math.abs(velocityData[i] - velocity));
    }

    return maxVariation < config.staticVelocityThreshold;
  }

  /**
   * Valida que todas as âncoras estão presentes nos dados decimados
   */
  static validateAnchors(
    originalData: DataPoint[],
    decimatedData: DataPoint[],
    requiredAnchors: number[]
  ): {isValid: boolean, missingAnchors: number[]} {

    const decimatedTimes = new Set(decimatedData.map(p => p.x));
    const missingAnchors: number[] = [];

    requiredAnchors.forEach(anchorIdx => {
      const anchorTime = originalData[anchorIdx].x;

      // Verificar se o timestamp da âncora está presente (com pequena tolerância)
      let found = false;
      for (const time of decimatedTimes) {
        if (Math.abs(time - anchorTime) < 0.001) {
          found = true;
          break;
        }
      }

      if (!found) {
        missingAnchors.push(anchorIdx);
      }
    });

    return {
      isValid: missingAnchors.length === 0,
      missingAnchors
    };
  }

  /**
   * Força inclusão de âncoras ausentes nos dados decimados
   */
  static forceIncludeAnchors(
    originalData: DataPoint[],
    decimatedData: DataPoint[],
    requiredAnchors: number[]
  ): DataPoint[] {

    const result = [...decimatedData];
    const decimatedTimes = new Set(decimatedData.map(p => p.x));

    requiredAnchors.forEach(anchorIdx => {
      const anchor = originalData[anchorIdx];

      // Verificar se âncora já está presente
      let found = false;
      for (const point of result) {
        if (Math.abs(point.x - anchor.x) < 0.001) {
          found = true;
          break;
        }
      }

      if (!found) {
        result.push(anchor);
      }
    });

    // Reordenar por timestamp
    return result.sort((a, b) => a.x - b.x);
  }
}