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

export type CacheValue = {
  userHasClaim: boolean;
  lastCheckedAt: moment.Moment;
}

export type ClaimCacheConfig = {
  enabled: boolean;
  cleanupIntervalInSeconds: number;
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

  /**
   * Enables the cache and initializes periodic cleanup.
   */
  public enable(): void {
    this.config.enabled = true;
    this.cleanupTimer = setInterval(this.removeOutdatedEntries, this.config.cleanupIntervalInSeconds * 1000);
  }

  /**
   * Disables the cache and stops periodic cleanup.
   */
  public disable(): void {
    this.config.enabled = false;
    clearInterval(this.cleanupTimer);
    this.clearEntireCache();
  }

  /**
   * Caches the given claim check result for the given userId and claim name.
   *
   * @param userId
   * @param claimName
   * @param hasClaim
   */
  public add(userId: string, claimName: string, hasClaim: boolean): void {

    if (!this.config.enabled) {
      return;
    }

    const userIdNotYetCached = !this.cache[userId];
    if (userIdNotYetCached) {
      this.cache[userId] = {};
    }

    const claimNotCached = !this.hasMatchingEntry(userId, claimName);

    if (claimNotCached) {
      this.cache[userId][claimName] = {
        userHasClaim: hasClaim,
        lastCheckedAt: moment(),
      };
    } else {
      this.cache[userId][claimName].userHasClaim = hasClaim;
      this.cache[userId][claimName].lastCheckedAt = moment();
    }
  }

  /**
   * Retrieves the cached check result for the given UserId and claim name.
   *
   * @param   userId    The UserId for which to get the claim check.
   * @param   claimName The name of the claim for which to get the cached
   *                    check result.
   * @returns           The cached claim check result, or "undefind",
   *                    if no matching cache entry exists.
   */
  public get(userId: string, claimName: string): CacheValue {
    if (!this.hasMatchingEntry(userId, claimName)) {
      return undefined;
    }

    return this.cache[userId][claimName];
  }

  /**
   * Checks if the cache contains a result for the given userId and claim name.
   *
   * @param   userId    The UserId for which to get the claim check.
   * @param   claimName The name of the claim for which to check if a cached
   *                    result exists.
   * @returns           "True", if the cache has a matching entry;
   *                    otherwise "false".
   */
  public hasMatchingEntry(userId: string, claimName: string): boolean {
    return this.cache[userId] !== undefined &&
           this.cache[userId][claimName] !== undefined;
  }

  private removeOutdatedEntries(): void {

    const cachedUserIds = Object.keys(this.cache);

    const now = moment();

    for (const userId of cachedUserIds) {

      const cachedUser = this.cache[userId];

      const cachedClaimsForUser = Object.keys(cachedUser);
      for (const claimName of cachedClaimsForUser) {

        const claim = cachedUser[claimName];

        const cacheEntryIsOutdated = now.isAfter(claim.lastCheckedAt);
        if (cacheEntryIsOutdated) {
          delete cachedUser[claimName];
        }
      }
    }
  }

  private clearEntireCache(): void {
    const cachedUserIds = Object.keys(this.cache);
    for (const userId of cachedUserIds) {
      delete this.cache[userId];
    }
  }

}
