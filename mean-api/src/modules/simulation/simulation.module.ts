import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { Simulation, SimulationSchema } from '@/database/simulation.schema';
import { RedisCacheModule } from '../cache/cache.module';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Simulation.name, schema: SimulationSchema }
    ]),
    RedisCacheModule,
  ],
  controllers: [SimulationController],
  providers: [SimulationService, CacheInterceptor],
  exports: [SimulationService],
})
export class SimulationModule {}