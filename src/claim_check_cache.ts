import * as moment from 'moment';

/**
 * Structure looks like:
 * {
 *   userId: {
 *     claim1: {
 *       userHasClaim: true,
 *       lastCheckedAt: '2019-07-01T09:11:13.000Z'
 *     },
 *     claim2: {
 *       userHasClaim: false,
 *       lastCheckedAt: '2019-07-01T09:12:16.000Z'
 *     },
 *   }
 * }
 */
type Cache = {[userId: string]: CacheEntry}

type CacheEntry = {[claimName: string]: CacheValue}

type CacheValue = {
  userHasClaim: boolean;
  lastCheckedAt: moment.Moment;
}

export type ClaimCacheConfig = {
  enabled: boolean;
  cleanupIntervalInMinutes: number;
}

export class ClaimCheckCache {

  private config: ClaimCacheConfig;

  private readonly cache: Cache = {};

  private cleanupTimer: NodeJS.Timeout;

  constructor(config: ClaimCacheConfig) {
    this.config = config;
    if (this.config.enabled) {
      this.enable();
    }
  }

  public enable(): void {
    this.cleanupTimer = setInterval(this.removeOutdatedEntries, this.config.cleanupIntervalInMinutes);
  }

  public disable(): void {
    clearInterval(this.cleanupTimer);
  }

  public add(userId: string, claimName: string, hasClaim: boolean): void {
  }

  private removeOutdatedEntries(): void {}

}
