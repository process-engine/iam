// Note: The tests are accessing private variables, so we must use this type of notation.
/* eslint-disable dot-notation */
import * as should from 'should';

import {ClaimCheckCache} from '../../dist/commonjs/claim_check_cache';

describe('ClaimCheckCache.enable()', (): void => {

  let testCache;

  before((): void => {
    const configToUse = {
      enabled: false,
      cleanupIntervalInSeconds: 1,
    };

    testCache = new ClaimCheckCache(configToUse);
  });

  afterEach((): void => {
    testCache.disable();
  });

  it('Should create and start a timer that periodically calls removeOutdatedEntries', async (): Promise<void> => {

    return new Promise((resolve, reject): void => {
      testCache.removeOutdatedEntries = (): void => {
        should(testCache.enabled).be.true();

        resolve();
      };

      testCache.enable();
    });
  });

  it('Should set the "enabled" flag to "true"', (): void => {
    testCache.enable();
    should(testCache.enabled).be.true();
  });

  it('Should ignore repeated calls, when the cache is already enabled', (): void => {
    testCache.enable();
    testCache.enable();
    testCache.enable();
    testCache.enable();
  });
});
