import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '@/modules/cache/cache.service';
import { SimulationService } from '@/modules/simulation/simulation.service';

@Injectable()
export class PrefetchService {
  private readonly logger = new Logger(PrefetchService.name);
  private prefetchQueue: Set<string> = new Set();
  private isProcessing = false;

  constructor(
    private readonly cacheService: CacheService,
    private readonly simulationService: SimulationService,
  ) {
    // Process prefetch queue every 30 seconds
    setInterval(() => {
      this.processPrefetchQueue();
    }, 30000);
  }

  /**
   * Add user to prefetch queue
   */
  async scheduleUserPrefetch(userId: string): Promise<void> {
    this.prefetchQueue.add(userId);
    this.logger.debug(`Scheduled prefetch for user: ${userId}`);
  }

  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    if (this.isProcessing || this.prefetchQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    this.logger.debug(`Processing prefetch queue: ${this.prefetchQueue.size} users`);

    const userIds = Array.from(this.prefetchQueue);
    this.prefetchQueue.clear();

    try {
      await Promise.allSettled(
        userIds.map(userId => this.prefetchUserData(userId))
      );
    } catch (error) {
      this.logger.error('Error processing prefetch queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Prefetch data for a specific user
   */
  private async prefetchUserData(userId: string): Promise<void> {
    try {
      this.logger.debug(`Prefetching data for user: ${userId}`);

      // Prefetch first page of user simulations
      const cacheKey = this.cacheService.generatePaginationKey(`user:${userId}:history`, 1, 10);
      const cached = await this.cacheService.get(cacheKey);

      if (!cached) {
        // Fetch and cache first page
        const simulations = await this.simulationService.getSimulations(1, 10, userId);
        await this.cacheService.cacheUserHistory(userId, 1, 10, simulations, undefined, 600);
        this.logger.debug(`Prefetched first page for user: ${userId}`);
      }

      // Prefetch second page if first page is full
      if (cached && (cached as any).data?.length === 10) {
        const page2Key = this.cacheService.generatePaginationKey(`user:${userId}:history`, 2, 10);
        const page2Cached = await this.cacheService.get(page2Key);

        if (!page2Cached) {
          const page2Simulations = await this.simulationService.getSimulations(2, 10, userId);
          await this.cacheService.cacheUserHistory(userId, 2, 10, page2Simulations, undefined, 600);
          this.logger.debug(`Prefetched second page for user: ${userId}`);
        }
      }

      // Prefetch recent simulation details
      await this.prefetchRecentSimulations(userId);

    } catch (error) {
      this.logger.error(`Error prefetching data for user ${userId}:`, error);
    }
  }

  /**
   * Prefetch recent simulation details
   */
  private async prefetchRecentSimulations(userId: string): Promise<void> {
    try {
      // Get user's recent simulations from cache or DB
      const historyKey = this.cacheService.generatePaginationKey(`user:${userId}:history`, 1, 5);
      let recentSimulations = await this.cacheService.get(historyKey);

      if (!recentSimulations) {
        recentSimulations = await this.simulationService.getSimulations(1, 5, userId);
      }

      if ((recentSimulations as any)?.data) {
        // Prefetch individual simulation details
        const prefetchPromises = (recentSimulations as any).data
          .filter((sim: any) => sim.status === 'completed')
          .slice(0, 3) // Only prefetch top 3
          .map(async (sim: any) => {
            const simKey = `simulation:${sim.id}:details`;
            const cached = await this.cacheService.get(simKey);

            if (!cached) {
              try {
                const details = await this.simulationService.getSimulation(sim.id);
                await this.cacheService.set(simKey, details, 3600);
                this.logger.debug(`Prefetched simulation details: ${sim.id}`);
              } catch (error) {
                // Ignore individual simulation errors
                this.logger.warn(`Failed to prefetch simulation ${sim.id}:`, error.message);
              }
            }
          });

        await Promise.allSettled(prefetchPromises);
      }
    } catch (error) {
      this.logger.error(`Error prefetching recent simulations for user ${userId}:`, error);
    }
  }

  /**
   * Trigger smart prefetching based on user behavior patterns
   */
  async triggerSmartPrefetch(userId: string, action: 'login' | 'simulation_view' | 'history_view'): Promise<void> {
    switch (action) {
      case 'login':
        // User just logged in, prefetch their dashboard data
        await this.scheduleUserPrefetch(userId);
        break;

      case 'simulation_view':
        // User viewed a simulation, prefetch their other recent simulations
        await this.prefetchRecentSimulations(userId);
        break;

      case 'history_view':
        // User viewed history, prefetch next page
        const nextPageKey = this.cacheService.generatePaginationKey(`user:${userId}:history`, 2, 10);
        const nextPageCached = await this.cacheService.get(nextPageKey);

        if (!nextPageCached) {
          try {
            const nextPage = await this.simulationService.getSimulations(2, 10, userId);
            await this.cacheService.cacheUserHistory(userId, 2, 10, nextPage, undefined, 600);
            this.logger.debug(`Prefetched next page for user: ${userId}`);
          } catch (error) {
            this.logger.warn(`Failed to prefetch next page for user ${userId}:`, error.message);
          }
        }
        break;
    }
  }

  /**
   * Get prefetch statistics
   */
  getPrefetchStats(): { queueSize: number; isProcessing: boolean } {
    return {
      queueSize: this.prefetchQueue.size,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear prefetch queue (for testing/admin purposes)
   */
  clearQueue(): void {
    this.prefetchQueue.clear();
    this.logger.debug('Prefetch queue cleared');
  }
}