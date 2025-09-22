import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccelerationCurve, AccelerationCurveDocument } from './acceleration-curve.schema';
import { CreateAccelerationCurveDto, CalculateAccelerationCurveDto, AccelerationCurveResponseDto } from './acceleration-curve.dto';

@Injectable()
export class AccelerationCurveService {
  constructor(
    @InjectModel(AccelerationCurve.name)
    private accelerationCurveModel: Model<AccelerationCurveDocument>,
  ) {}

  calculateCurvePoints(config: CalculateAccelerationCurveDto): Array<{ velocity: number; acceleration: number }> {
    const points: Array<{ velocity: number; acceleration: number }> = [];
    let currentAcceleration = config.initialAcceleration;

    for (let velocity = 0; velocity <= config.maxVelocity; velocity += config.velocityIncrement) {
      if (velocity <= config.linearVelocityThreshold) {
        currentAcceleration = config.initialAcceleration;
      } else {
        currentAcceleration = currentAcceleration - (currentAcceleration / config.lossFactor);
      }

      points.push({
        velocity,
        acceleration: currentAcceleration,
      });
    }

    return points;
  }

  async create(userId: string, createDto: CreateAccelerationCurveDto): Promise<AccelerationCurveResponseDto> {
    const points = this.calculateCurvePoints({
      linearVelocityThreshold: createDto.linearVelocityThreshold,
      initialAcceleration: createDto.initialAcceleration,
      velocityIncrement: createDto.velocityIncrement,
      lossFactor: createDto.lossFactor,
      maxVelocity: createDto.maxVelocity,
    });

    if (createDto.isDefault) {
      await this.accelerationCurveModel.updateMany(
        { userId: new Types.ObjectId(userId), isDefault: true },
        { isDefault: false }
      );
    }

    const curve = new this.accelerationCurveModel({
      userId: new Types.ObjectId(userId),
      name: createDto.name,
      linearVelocityThreshold: createDto.linearVelocityThreshold,
      initialAcceleration: createDto.initialAcceleration,
      velocityIncrement: createDto.velocityIncrement,
      lossFactor: createDto.lossFactor,
      maxVelocity: createDto.maxVelocity,
      points,
      isDefault: createDto.isDefault || false,
    });

    const savedCurve = await curve.save();
    return this.toResponseDto(savedCurve);
  }

  async findAll(userId: string): Promise<AccelerationCurveResponseDto[]> {
    const curves = await this.accelerationCurveModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .sort({ createdAt: -1 })
      .exec();

    return curves.map(curve => this.toResponseDto(curve));
  }

  async findOne(userId: string, id: string): Promise<AccelerationCurveResponseDto> {
    const curve = await this.accelerationCurveModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).exec();

    if (!curve) {
      throw new NotFoundException('Curva de aceleração não encontrada');
    }

    return this.toResponseDto(curve);
  }

  async findDefault(userId: string): Promise<AccelerationCurveResponseDto | null> {
    const curve = await this.accelerationCurveModel.findOne({
      userId: new Types.ObjectId(userId),
      isDefault: true,
      isActive: true,
    }).exec();

    return curve ? this.toResponseDto(curve) : null;
  }

  async update(userId: string, id: string, updateDto: CreateAccelerationCurveDto): Promise<AccelerationCurveResponseDto> {
    const curve = await this.accelerationCurveModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).exec();

    if (!curve) {
      throw new NotFoundException('Curva de aceleração não encontrada');
    }

    if (updateDto.isDefault) {
      await this.accelerationCurveModel.updateMany(
        { userId: new Types.ObjectId(userId), isDefault: true },
        { isDefault: false }
      );
    }

    const points = this.calculateCurvePoints({
      linearVelocityThreshold: updateDto.linearVelocityThreshold,
      initialAcceleration: updateDto.initialAcceleration,
      velocityIncrement: updateDto.velocityIncrement,
      lossFactor: updateDto.lossFactor,
      maxVelocity: updateDto.maxVelocity,
    });

    Object.assign(curve, {
      ...updateDto,
      points,
    });

    const updatedCurve = await curve.save();
    return this.toResponseDto(updatedCurve);
  }

  async delete(userId: string, id: string): Promise<void> {
    const curve = await this.accelerationCurveModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!curve) {
      throw new NotFoundException('Curva de aceleração não encontrada');
    }

    curve.isActive = false;
    await curve.save();
  }

  calculate(config: CalculateAccelerationCurveDto): Array<{ velocity: number; acceleration: number }> {
    return this.calculateCurvePoints(config);
  }

  private toResponseDto(curve: AccelerationCurveDocument): AccelerationCurveResponseDto {
    const doc = curve as any;
    return {
      id: doc._id.toString(),
      userId: curve.userId.toString(),
      name: curve.name,
      linearVelocityThreshold: curve.linearVelocityThreshold,
      initialAcceleration: curve.initialAcceleration,
      velocityIncrement: curve.velocityIncrement,
      lossFactor: curve.lossFactor,
      maxVelocity: curve.maxVelocity,
      points: curve.points,
      isDefault: curve.isDefault,
      isActive: curve.isActive,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }
}