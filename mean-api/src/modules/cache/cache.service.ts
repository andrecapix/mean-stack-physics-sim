import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  /**
   * Reset cache (clear all)
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      console.error('Cache reset error:', error);
    }
  }

  /**
   * Cache simulation results
   */
  async cacheSimulationResult(simulationId: string, result: any, ttl = 3600): Promise<void> {
    const key = `simulation:${simulationId}`;
    await this.set(key, result, ttl);
  }

  /**
   * Get cached simulation result
   */
  async getCachedSimulationResult(simulationId: string): Promise<any | undefined> {
    const key = `simulation:${simulationId}`;
    return await this.get(key);
  }

  /**
   * Cache user session data
   */
  async cacheUserSession(userId: string, sessionData: any, ttl = 900): Promise<void> {
    const key = `user:session:${userId}`;
    await this.set(key, sessionData, ttl);
  }

  /**
   * Get cached user session
   */
  async getCachedUserSession(userId: string): Promise<any | undefined> {
    const key = `user:session:${userId}`;
    return await this.get(key);
  }

  /**
   * Generate cache key for simulation parameters
   */
  generateSimulationKey(params: any): string {
    // Create a hash of simulation parameters for consistent caching
    const paramsStr = JSON.stringify(params, Object.keys(params).sort());
    return `sim_params:${Buffer.from(paramsStr).toString('base64')}`;
  }
}