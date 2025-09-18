import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SimulationDocument = Simulation & Document;

@Schema({ collection: 'stations' })
export class Station {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  km: number;
}

export const StationSchema = SchemaFactory.createForClass(Station);

@Schema({ collection: 'simulation_params' })
export class SimulationParams {
  @Prop({ required: true, min: 0 })
  initialAcceleration: number;

  @Prop({ required: true, min: 0 })
  thresholdVelocity: number;

  @Prop({ required: true, min: 0 })
  maxVelocity: number;

  @Prop({ required: true, min: 0 })
  dwellTime: number;

  @Prop({ required: true, min: 0 })
  terminalLayover: number;

  @Prop({ type: [StationSchema], required: true })
  stations: Station[];
}

export const SimulationParamsSchema = SchemaFactory.createForClass(SimulationParams);

@Schema({ collection: 'schedule_entries' })
export class ScheduleEntry {
  @Prop({ required: true })
  station: string;

  @Prop({ required: true, min: 0 })
  arrivalTime: number;

  @Prop({ required: true, min: 0 })
  departureTime: number;
}

export const ScheduleEntrySchema = SchemaFactory.createForClass(ScheduleEntry);

@Schema({ collection: 'simulation_results' })
export class SimulationResults {
  @Prop({ type: [Number], required: true })
  time: number[];

  @Prop({ type: [Number], required: true })
  position: number[];

  @Prop({ type: [Number], required: true })
  velocity: number[];

  @Prop({ type: [ScheduleEntrySchema], required: true })
  schedule: ScheduleEntry[];
}

export const SimulationResultsSchema = SchemaFactory.createForClass(SimulationResults);

@Schema({
  collection: 'simulations',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Simulation {
  @Prop({ type: SimulationParamsSchema, required: true })
  params: SimulationParams;

  @Prop({ type: SimulationResultsSchema, required: false })
  results?: SimulationResults;

  @Prop({ required: true, enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;

  @Prop({ required: false })
  userId?: string;

  @Prop({ required: false })
  error?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const SimulationSchema = SchemaFactory.createForClass(Simulation);