import { IsNumber, IsString, IsArray, IsBoolean, IsOptional, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AccelerationCurvePointDto {
  @IsNumber()
  velocity: number;

  @IsNumber()
  acceleration: number;
}

export class CreateAccelerationCurveDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  linearVelocityThreshold: number;

  @IsNumber()
  @Min(0.1)
  @Max(3.0)
  initialAcceleration: number;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  velocityIncrement: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  lossFactor: number;

  @IsNumber()
  @Min(10)
  @Max(300)
  maxVelocity: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CalculateAccelerationCurveDto {
  @IsNumber()
  @Min(1)
  @Max(100)
  linearVelocityThreshold: number;

  @IsNumber()
  @Min(0.1)
  @Max(3.0)
  initialAcceleration: number;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  velocityIncrement: number;

  @IsNumber()
  @Min(1)
  @Max(1000)
  lossFactor: number;

  @IsNumber()
  @Min(10)
  @Max(300)
  maxVelocity: number;
}

export class AccelerationCurveResponseDto {
  id: string;
  userId: string;
  name: string;
  linearVelocityThreshold: number;
  initialAcceleration: number;
  velocityIncrement: number;
  lossFactor: number;
  maxVelocity: number;
  points: AccelerationCurvePointDto[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}