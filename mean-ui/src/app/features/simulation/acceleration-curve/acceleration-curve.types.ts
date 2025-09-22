export interface AccelerationCurveConfig {
  linearVelocityThreshold: number; // km/h
  initialAcceleration: number; // m/s²
  velocityIncrement: number; // km/h
  lossFactor: number; // dimensionless
  maxVelocity: number; // km/h
}

export interface AccelerationCurvePoint {
  velocity: number; // km/h
  acceleration: number; // m/s²
}

export interface AccelerationCurveData {
  config: AccelerationCurveConfig;
  points: AccelerationCurvePoint[];
  createdAt?: Date;
  id?: string;
}