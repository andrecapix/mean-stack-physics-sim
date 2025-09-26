import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '@/modules/cache/cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Generate cache key based on URL and query parameters
    const cacheKey = this.generateCacheKey(request);

    // Try to get from cache
    const cachedResponse = await this.cacheService.get(cacheKey);
    if (cachedResponse) {
      console.log(`Cache HIT: ${cacheKey}`);

      // Set cache headers
      response.setHeader('X-Cache', 'HIT');
      response.setHeader('X-Cache-Key', cacheKey);

      return of(cachedResponse);
    }

    console.log(`Cache MISS: ${cacheKey}`);
    response.setHeader('X-Cache', 'MISS');
    response.setHeader('X-Cache-Key', cacheKey);

    return next.handle().pipe(
      tap(async (data) => {
        // Cache the response with appropriate TTL
        const ttl = this.getTTL(request);
        await this.cacheService.set(cacheKey, data, ttl);
        console.log(`Cached response: ${cacheKey} (TTL: ${ttl}s)`);
      })
    );
  }

  private generateCacheKey(request: any): string {
    const { url, query, user } = request;

    // Include user ID for user-specific data
    const userId = user?.userId || 'anonymous';

    // Sort query parameters for consistent keys
    const sortedQuery = Object.keys(query || {})
      .sort()
      .reduce((acc: Record<string, any>, key: string) => {
        acc[key] = query[key];
        return acc;
      }, {});

    const queryString = Object.keys(sortedQuery).length > 0
      ? JSON.stringify(sortedQuery)
      : '';

    return `endpoint:${userId}:${url}${queryString ? ':' + Buffer.from(queryString).toString('base64') : ''}`;
  }

  private getTTL(request: any): number {
    const { url } = request;

    // Different TTL for different endpoints
    if (url.includes('/simulation')) {
      if (url.includes('/simulation/') && !url.includes('/simulation?')) {
        // Individual simulation - cache longer since they don't change
        return 3600; // 1 hour
      }
      // Simulation lists - shorter TTL since new simulations are added
      return 300; // 5 minutes
    }

    if (url.includes('/auth/profile')) {
      return 900; // 15 minutes
    }

    if (url.includes('/acceleration-curve')) {
      return 1800; // 30 minutes
    }

    // Default TTL
    return 300; // 5 minutes
  }
}