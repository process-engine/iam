/* eslint-disable @typescript-eslint/no-explicit-any */
import * as moment from 'moment';

export class ClaimCheckCacheMock {

  public config: any;

  private cache: any = {
    userId1: {
      claim1: {
        userHasClaim: true,
        lastCheckedAt: moment(),
      },
      claim2: {
        userHasClaim: false,
        lastCheckedAt: moment(),
      },
    },
    userId2: {
      claim1: {
        userHasClaim: false,
        lastCheckedAt: moment(),
      },
      claim3: {
        userHasClaim: true,
        lastCheckedAt: moment(),
      },
    },
  };

  constructor(config: any) {
    this.config = config;
  }

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

  public get(userId: string, claimName: string): any {
    if (!this.hasMatchingEntry(userId, claimName)) {
      return undefined;
    }

    return this.cache[userId][claimName];
  }

  public hasMatchingEntry(userId: string, claimName: string): boolean {
    return this.cache[userId] !== undefined &&
           this.cache[userId][claimName] !== undefined;
  }

}
