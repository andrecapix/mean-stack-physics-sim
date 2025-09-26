import { Controller, Post, Get, Param, Query, Body, Request, UseInterceptors } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { CreateSimulationDto, SimulationResultDto, PaginatedSimulationsDto } from './dto/simulation.dto';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { PrefetchService } from '@/common/services/prefetch.service';

@Controller('simulation')
@UseInterceptors(CacheInterceptor)
export class SimulationController {
  constructor(
    private readonly simulationService: SimulationService,
    private readonly prefetchService: PrefetchService,
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
  async getSimulation(@Param('id') id: string, @Request() req?: any): Promise<SimulationResultDto> {
    const userId = req?.user?.userId;
    console.log('Getting simulation', { simulationId: id, userId });

    // Trigger smart prefetching for user's other simulations
    if (userId) {
      this.prefetchService.triggerSmartPrefetch(userId, 'simulation_view');
    }

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

    // Trigger smart prefetching for next page
    if (userId) {
      this.prefetchService.triggerSmartPrefetch(userId, 'history_view');
    }

    return this.simulationService.getSimulations(page, limit, userId);
  }
}