import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT for key: ${key}`);
      } else {
        this.logger.debug(`Cache MISS for key: ${key}`);
      }
      return value || null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET for key: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Reset cache (clear all)
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache RESET - all keys cleared');
    } catch (error) {
      this.logger.error('Cache RESET error:', error);
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

  /**
   * Get or set pattern - if key exists return it, otherwise compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Generate cache key for user-specific data
   */
  generateUserKey(userId: string, type: string, ...args: string[]): string {
    return `user:${userId}:${type}${args.length ? ':' + args.join(':') : ''}`;
  }

  /**
   * Generate cache key for paginated results
   */
  generatePaginationKey(base: string, page: number, limit: number, filters?: Record<string, any>): string {
    let key = `${base}:page:${page}:limit:${limit}`;
    if (filters && Object.keys(filters).length > 0) {
      const filterString = JSON.stringify(filters);
      key += `:filters:${Buffer.from(filterString).toString('base64')}`;
    }
    return key;
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    // Invalidate common user cache keys
    const commonKeys = [
      this.generateUserKey(userId, 'simulations'),
      this.generateUserKey(userId, 'history'),
      this.generateUserKey(userId, 'profile'),
    ];

    await Promise.all(commonKeys.map(key => this.del(key)));
    this.logger.debug(`Invalidated cache for user: ${userId}`);
  }

  /**
   * Cache simulation results by parameters (for duplicate simulation detection)
   */
  async cacheSimulationByParams(params: any, result: any, ttl = 3600): Promise<void> {
    const key = this.generateSimulationKey(params);
    await this.set(key, result, ttl);
  }

  /**
   * Get simulation by parameters
   */
  async getSimulationByParams(params: any): Promise<any | null> {
    const key = this.generateSimulationKey(params);
    return await this.get(key);
  }

  /**
   * Cache user's simulation history with pagination
   */
  async cacheUserHistory(
    userId: string,
    page: number,
    limit: number,
    data: any,
    filters?: Record<string, any>,
    ttl = 600
  ): Promise<void> {
    const key = this.generatePaginationKey(`user:${userId}:history`, page, limit, filters);
    await this.set(key, data, ttl);
  }

  /**
   * Get cached user history
   */
  async getCachedUserHistory(
    userId: string,
    page: number,
    limit: number,
    filters?: Record<string, any>
  ): Promise<any | null> {
    const key = this.generatePaginationKey(`user:${userId}:history`, page, limit, filters);
    return await this.get(key);
  }
}