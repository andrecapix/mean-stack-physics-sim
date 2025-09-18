import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Simulation, SimulationDocument } from '@/database/simulation.schema';
import { CreateSimulationDto, SimulationResultDto, PaginatedSimulationsDto } from './dto/simulation.dto';

@Injectable()
export class SimulationService {
  private readonly simEngineUrl: string;

  constructor(
    @InjectModel(Simulation.name) private simulationModel: Model<SimulationDocument>,
    private configService: ConfigService,
  ) {
    this.simEngineUrl = this.configService.get<string>('SIM_ENGINE_URL', 'http://localhost:8000');
  }

  async createSimulation(createSimulationDto: CreateSimulationDto, userId?: string): Promise<{ id: string; status: string }> {
    try {
      const simulation = new this.simulationModel({
        params: createSimulationDto.params,
        status: 'pending',
        userId,
      });

      const savedSimulation = await simulation.save();
      console.log('Simulation created', { simulationId: savedSimulation._id, userId });

      // Processar simulação em background
      this.processSimulation((savedSimulation._id as any).toString());

      return {
        id: (savedSimulation._id as any).toString(),
        status: 'processing',
      };
    } catch (error) {
      console.error('Failed to create simulation', { error: error.message, userId });
      throw new InternalServerErrorException('Failed to create simulation');
    }
  }

  async getSimulation(id: string): Promise<SimulationResultDto> {
    try {
      const simulation = await this.simulationModel.findById(id).exec();

      if (!simulation) {
        throw new NotFoundException(`Simulation with ID ${id} not found`);
      }

      return this.mapToResultDto(simulation);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Failed to get simulation', { error: error.message, simulationId: id });
      throw new InternalServerErrorException('Failed to retrieve simulation');
    }
  }

  async getSimulations(page: number = 1, limit: number = 10, userId?: string): Promise<PaginatedSimulationsDto> {
    try {
      const skip = (page - 1) * limit;
      const filter = userId ? { userId } : {};

      const [simulations, total] = await Promise.all([
        this.simulationModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.simulationModel.countDocuments(filter).exec(),
      ]);

      const data = simulations.map(sim => this.mapToResultDto(sim));

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Failed to get simulations', { error: error.message, userId });
      throw new InternalServerErrorException('Failed to retrieve simulations');
    }
  }

  private async processSimulation(simulationId: string): Promise<void> {
    try {
      await this.simulationModel.findByIdAndUpdate(simulationId, { status: 'processing' });

      const simulation = await this.simulationModel.findById(simulationId).exec();
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      console.info('Starting simulation processing', { simulationId });

      // Chamar microserviço Python
      const simulationParams = {
        initial_accel: simulation.params.initialAcceleration,
        threshold_speed: simulation.params.thresholdVelocity,
        max_speed: simulation.params.maxVelocity,
        stations: simulation.params.stations.map(s => ({ name: s.name, km: s.km })),
        dwell_time: simulation.params.dwellTime,
        terminal_layover: simulation.params.terminalLayover,
        dt: 0.1,
      };

      const response = await axios.post(`${this.simEngineUrl}/simulate`, simulationParams, {
        timeout: 30000,
      });

      const results = {
        time: response.data.time,
        position: response.data.position,
        velocity: response.data.velocity,
        schedule: response.data.schedule.map((entry: any) => ({
          station: entry.station,
          arrivalTime: entry.arrival_time,
          departureTime: entry.departure_time,
        })),
      };

      await this.simulationModel.findByIdAndUpdate(simulationId, {
        results,
        status: 'completed',
      });

      console.info('Simulation completed successfully', { simulationId });
    } catch (error) {
      console.error('Simulation processing failed', {
        error: error.message,
        simulationId,
      });

      await this.simulationModel.findByIdAndUpdate(simulationId, {
        status: 'failed',
        error: error.message,
      });
    }
  }

  private mapToResultDto(simulation: SimulationDocument): SimulationResultDto {
    return {
      id: (simulation._id as any).toString(),
      params: {
        initialAcceleration: simulation.params.initialAcceleration,
        thresholdVelocity: simulation.params.thresholdVelocity,
        maxVelocity: simulation.params.maxVelocity,
        dwellTime: simulation.params.dwellTime,
        terminalLayover: simulation.params.terminalLayover,
        stations: simulation.params.stations.map(s => ({ name: s.name, km: s.km })),
      },
      results: simulation.results ? {
        time: simulation.results.time,
        position: simulation.results.position,
        velocity: simulation.results.velocity,
        schedule: simulation.results.schedule.map(entry => ({
          station: entry.station,
          arrivalTime: entry.arrivalTime,
          departureTime: entry.departureTime,
        })),
      } : undefined,
      status: simulation.status,
      error: simulation.error,
      createdAt: simulation.createdAt,
    };
  }
}