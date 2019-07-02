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
  cacheLifetimeInSeconds: number;
  cleanupIntervalInSeconds: number;
}

export class ClaimCheckCache {

  private config: ClaimCacheConfig;

  private readonly cache: Cache = {};

  private cleanupTimer: NodeJS.Timeout;

  private isEnabled = false;

  private readonly defaultConfig: ClaimCacheConfig = {
    enabled: true,
    cacheLifetimeInSeconds: 300,
    cleanupIntervalInSeconds: 10,
  };

  constructor(config: ClaimCacheConfig) {

    this.config = config || this.defaultConfig;
    if (this.config.enabled) {
      this.enable();
    }
  }

  /**
   * Returns the current enabled-status of the cache.
   */
  public get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enables the cache and initializes periodic cleanup.
   */
  public enable(): void {
    if (this.isEnabled) {
      return;
    }

    this.isEnabled = true;

    const intervalInMs = this.config.cleanupIntervalInSeconds !== undefined
      ? this.config.cleanupIntervalInSeconds * 1000
      : this.defaultConfig.cleanupIntervalInSeconds * 1000;

    const cacheLifeTimeInSeconds = this.config.cacheLifetimeInSeconds !== undefined
      ? this.config.cacheLifetimeInSeconds
      : this.defaultConfig.cacheLifetimeInSeconds;

    const cachedValuesDoNotExpire = intervalInMs === 0 || cacheLifeTimeInSeconds === 0;
    if (cachedValuesDoNotExpire) {
      return;
    }

    this.cleanupTimer = setInterval(this.removeOutdatedEntries, intervalInMs);
  }

  /**
   * Disables the cache and stops periodic cleanup.
   */
  public disable(): void {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;
    this.clearEntireCache();

    if (this.cleanupTimer !== undefined) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Caches the given claim check result for the given userId and claim name.
   *
   * @param userId    The userId for which to cache a claim check result.
   * @param claimName The name of the claim for which to cache a result.
   * @param hasClaim  The result of the claim check to cache.
   */
  public add(userId: string, claimName: string, hasClaim: boolean): void {

    if (!this.isEnabled) {
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

    const cacheLifeTimeInSeconds = this.config.cacheLifetimeInSeconds || this.defaultConfig.cacheLifetimeInSeconds;

    // Using 0 means that the cached values will never expire.
    if (cacheLifeTimeInSeconds === 0) {
      return;
    }

    for (const userId of cachedUserIds) {

      const cachedUser = this.cache[userId];

      const cachedClaimsForUser = Object.keys(cachedUser);
      for (const claimName of cachedClaimsForUser) {

        const claim = cachedUser[claimName];

        const cacheValueExpirationTime = claim.lastCheckedAt.add(cacheLifeTimeInSeconds, 'second');

        const cacheEntryIsOutdated = now.isAfter(cacheValueExpirationTime);
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
