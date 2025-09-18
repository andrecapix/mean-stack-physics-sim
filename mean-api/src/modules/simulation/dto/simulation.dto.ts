import { IsNumber, IsString, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StationDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  km: number;
}

export class SimulationParamsDto {
  @IsNumber()
  @Min(0)
  initialAcceleration: number;

  @IsNumber()
  @Min(0)
  thresholdVelocity: number;

  @IsNumber()
  @Min(0)
  maxVelocity: number;

  @IsNumber()
  @Min(0)
  dwellTime: number;

  @IsNumber()
  @Min(0)
  terminalLayover: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StationDto)
  stations: StationDto[];
}

export class ScheduleEntryDto {
  @IsString()
  station: string;

  @IsNumber()
  @Min(0)
  arrivalTime: number;

  @IsNumber()
  @Min(0)
  departureTime: number;
}

export class SimulationResultDto {
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => SimulationParamsDto)
  params: SimulationParamsDto;

  @IsOptional()
  results?: {
    time: number[];
    position: number[];
    velocity: number[];
    schedule: ScheduleEntryDto[];
  };

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  error?: string;

  createdAt: Date;
}

export class CreateSimulationDto {
  @ValidateNested()
  @Type(() => SimulationParamsDto)
  params: SimulationParamsDto;
}

export class PaginatedSimulationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulationResultDto)
  data: SimulationResultDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  totalPages: number;
}