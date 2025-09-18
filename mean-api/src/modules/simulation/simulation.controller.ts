import { Controller, Post, Get, Param, Query, Body, Request } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { CreateSimulationDto, SimulationResultDto, PaginatedSimulationsDto } from './dto/simulation.dto';

@Controller('simulation')
export class SimulationController {
  constructor(
    private readonly simulationService: SimulationService,
  ) {}

  @Post()
  async createSimulation(
    @Body() createSimulationDto: CreateSimulationDto,
    @Request() req?: any,
  ): Promise<{ id: string; status: string }> {
    const userId = req?.user?.userId;
    console.log('Creating simulation', { userId, params: createSimulationDto.params });

    return this.simulationService.createSimulation(createSimulationDto, userId);
  }

  @Get(':id')
  async getSimulation(@Param('id') id: string): Promise<SimulationResultDto> {
    console.log('Getting simulation', { simulationId: id });
    return this.simulationService.getSimulation(id);
  }

  @Get()
  async getSimulations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req?: any,
  ): Promise<PaginatedSimulationsDto> {
    const userId = req?.user?.userId;
    console.log('Getting simulations', { userId, page, limit });

    return this.simulationService.getSimulations(page, limit, userId);
  }
}