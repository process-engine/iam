/* eslint-disable @typescript-eslint/no-explicit-any */
import * as should from 'should';

import {IAMService} from '../../dist/commonjs/iam_service';

import {ClaimCheckCacheMock, HttpClientMock} from '../mocks';

describe('IamService.checkIfUserHasClaim()', (): void => {

  let iamService;

  beforeEach((): void => {
    const claimCheckCacheMock = new ClaimCheckCacheMock({enabled: true});
    const httpClientMock = new HttpClientMock();

    iamService = new IAMService(httpClientMock);
    iamService.cache = claimCheckCacheMock;
  });

  it('Should use the result returned from the cache, if the cache does not return undefined', async (): Promise<void> => {
    iamService.getFromCache = (): any => {
      return {
        userHasClaim: true,
      };
    };

    iamService.getFromAuthority = (): Promise<any> => {
      return Promise.resolve(false);
    };

    const result = await iamService.checkIfUserHasClaim({userId: '123'}, 'claim');

    should(result).be.true();
  });

  it('Should use the result returned from the authority, if the cache returns undefined', async (): Promise<void> => {
    iamService.getFromCache = (): any => {
      return undefined;
    };

    iamService.getFromAuthority = (): Promise<any> => {
      return Promise.resolve(false);
    };

    const result = await iamService.checkIfUserHasClaim({userId: '123'}, 'claim');

    should(result).be.false();
  });

  it('Should store the result from the authority in the cache', async (): Promise<void> => {

    return new Promise(async (resolve, reject): Promise<void> => {
      iamService.getFromCache = (): any => {
        return undefined;
      };

      iamService.getFromAuthority = (): Promise<any> => {
        return Promise.resolve(false);
      };

      const dummyIdentity = {userId: '123'};
      const dummyClaim = 'claim';

      iamService.cache.add = (userId: string, claimName: string, hasClaim: boolean): void => {
        try {
          should(userId).be.equal(dummyIdentity.userId);
          should(claimName).be.equal(dummyClaim);
          should(hasClaim).be.false();
        } catch (error) {
          reject(error);
        }

        resolve();
      };

      const result = await iamService.checkIfUserHasClaim(dummyIdentity, dummyClaim);

      should(result).be.false();
    });
  });

});
