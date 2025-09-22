import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccelerationCurveDocument = AccelerationCurve & Document;

@Schema()
export class AccelerationCurvePoint {
  @Prop({ required: true })
  velocity: number; // km/h

  @Prop({ required: true })
  acceleration: number; // m/s²
}

@Schema({ timestamps: true })
export class AccelerationCurve {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  linearVelocityThreshold: number; // km/h

  @Prop({ required: true })
  initialAcceleration: number; // m/s²

  @Prop({ required: true })
  velocityIncrement: number; // km/h

  @Prop({ required: true })
  lossFactor: number; // dimensionless

  @Prop({ required: true })
  maxVelocity: number; // km/h

  @Prop({ type: [AccelerationCurvePoint], required: true })
  points: AccelerationCurvePoint[];

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const AccelerationCurveSchema = SchemaFactory.createForClass(AccelerationCurve);