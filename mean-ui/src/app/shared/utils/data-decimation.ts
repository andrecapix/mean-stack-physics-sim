/**
 * Data Decimation Utilities
 * Implementação LTTB (Largest Triangle Three Bucket) para otimização visual
 * IMPORTANTE: Usado APENAS para exibição, dados originais sempre preservados
 */

export interface DataPoint {
  x: number;
  y: number;
}

export class DataDecimation {
  /**
   * Implementação do algoritmo LTTB (Largest Triangle Three Bucket)
   * Reduz pontos de dados mantendo características visuais importantes
   */
  static applyLTTB(data: DataPoint[], threshold: number): DataPoint[] {
    if (data.length <= threshold) {
      return [...data]; // Retorna cópia dos dados originais
    }

    if (threshold <= 2) {
      return [data[0], data[data.length - 1]];
    }

    const sampled: DataPoint[] = [];

    // Sempre incluir primeiro ponto
    sampled.push(data[0]);

    // Calcular tamanho do bucket
    const bucketSize = (data.length - 2) / (threshold - 2);

    let bucketStart = 1;
    let bucketEnd = Math.floor(bucketStart + bucketSize);

    for (let i = 0; i < threshold - 2; i++) {
      // Ponto A (último ponto selecionado)
      const pointA = sampled[sampled.length - 1];

      // Ponto C (próximo bucket - média)
      let avgX = 0;
      let avgY = 0;
      const nextBucketStart = Math.floor(bucketEnd);
      const nextBucketEnd = Math.min(
        Math.floor(nextBucketStart + bucketSize),
        data.length - 1
      );

      const nextBucketSize = nextBucketEnd - nextBucketStart;
      if (nextBucketSize > 0) {
        for (let j = nextBucketStart; j < nextBucketEnd; j++) {
          avgX += data[j].x;
          avgY += data[j].y;
        }
        avgX /= nextBucketSize;
        avgY /= nextBucketSize;
      } else {
        avgX = data[data.length - 1].x;
        avgY = data[data.length - 1].y;
      }

      const pointC = { x: avgX, y: avgY };

      // Encontrar ponto B com maior área do triângulo
      let maxArea = -1;
      let selectedPoint = data[bucketStart];

      for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
        const pointB = data[j];

        // Calcular área do triângulo ABC
        const area = Math.abs(
          (pointA.x - pointC.x) * (pointB.y - pointA.y) -
          (pointA.x - pointB.x) * (pointC.y - pointA.y)
        ) * 0.5;

        if (area > maxArea) {
          maxArea = area;
          selectedPoint = pointB;
        }
      }

      sampled.push(selectedPoint);

      // Próximo bucket
      bucketStart = bucketEnd;
      bucketEnd = Math.floor(bucketStart + bucketSize);
    }

    // Sempre incluir último ponto
    sampled.push(data[data.length - 1]);

    return sampled;
  }

  /**
   * Converte arrays separados em array de DataPoints
   */
  static arrayToDataPoints(xArray: number[], yArray: number[]): DataPoint[] {
    const points: DataPoint[] = [];
    const length = Math.min(xArray.length, yArray.length);

    for (let i = 0; i < length; i++) {
      points.push({ x: xArray[i], y: yArray[i] });
    }

    return points;
  }

  /**
   * Converte DataPoints de volta para arrays separados
   */
  static dataPointsToArrays(points: DataPoint[]): { x: number[], y: number[] } {
    const xArray: number[] = [];
    const yArray: number[] = [];

    points.forEach(point => {
      xArray.push(point.x);
      yArray.push(point.y);
    });

    return { x: xArray, y: yArray };
  }

  /**
   * Aplicar decimação mantendo dados originais intactos
   */
  static decimateForDisplay(
    timeArray: number[],
    valueArray: number[],
    maxPoints: number = 1000
  ): { time: number[], values: number[] } {

    if (timeArray.length <= maxPoints) {
      // Retornar cópias dos arrays originais
      return {
        time: [...timeArray],
        values: [...valueArray]
      };
    }

    // Converter para DataPoints
    const dataPoints = this.arrayToDataPoints(timeArray, valueArray);

    // Aplicar LTTB
    const decimatedPoints = this.applyLTTB(dataPoints, maxPoints);

    // Converter de volta para arrays
    const result = this.dataPointsToArrays(decimatedPoints);

    return {
      time: result.x,
      values: result.y
    };
  }

  /**
   * Encontrar índice do ponto original mais próximo
   * Útil para tooltips precisos
   */
  static findNearestOriginalIndex(
    originalTimeArray: number[],
    targetTime: number
  ): number {
    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < originalTimeArray.length; i++) {
      const distance = Math.abs(originalTimeArray[i] - targetTime);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  }
}