// Note: The tests are accessing private variables, so we must use this type of notation.
/* eslint-disable dot-notation */
import * as should from 'should';

import {ClaimCheckCache} from '../../dist/commonjs/claim_check_cache';

describe('ClaimCheckCache.add()', (): void => {

  it('Should add entries to an enabled cache', (): void => {
    const configToUse = {
      enabled: true,
      cleanupIntervalInSeconds: 666,
    };
    const cache = new ClaimCheckCache(configToUse);

    cache.add('userId', 'claim', true);

    should(cache.enabled).be.true();
    should.exist(cache['cache']['userId']);

    should(cache['cache']['userId']['claim'].userHasClaim).be.true();

    cache.disable();
  });

  it('Should not add entries to a disabled cache', (): void => {
    const configToUse = {
      enabled: false,
      cleanupIntervalInSeconds: 120000,
    };
    const cache = new ClaimCheckCache(configToUse);

    cache.add('userId', 'claim', true);

    should(cache.enabled).be.false();
    should.not.exist(cache['cache']['userId']);
  });

});
