import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';
import { PrefetchService } from '@/common/services/prefetch.service';
import { SimulationModule } from '@/modules/simulation/simulation.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        // If no Redis URL provided, use in-memory cache for development
        if (!redisUrl) {
          console.log('🔄 Redis URL not found, using in-memory cache');
          return {
            ttl: 300, // 5 minutes default TTL
            max: 100, // maximum number of items in cache
          };
        }

        console.log('🔗 Connecting to Redis:', redisUrl.substring(0, 20) + '...');

        return {
          store: await redisStore({
            url: redisUrl,
            ttl: 300000, // 5 minutes in milliseconds
          }),
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => SimulationModule),
  ],
  providers: [CacheService, PrefetchService],
  exports: [CacheModule, CacheService, PrefetchService],
})
export class RedisCacheModule {}