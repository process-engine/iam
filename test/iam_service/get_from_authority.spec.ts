/* eslint-disable @typescript-eslint/no-explicit-any */
import * as should from 'should';

import {IAMService} from '../../dist/commonjs/iam_service';

import {ClaimCheckCacheMock, HttpClientMock} from '../mocks';

describe('IamService.getFromAuthority()', (): void => {

  let iamService;

  beforeEach((): void => {
    const claimCheckCacheMock = new ClaimCheckCacheMock({enabled: true});
    const httpClientMock = new HttpClientMock();

    iamService = new IAMService(httpClientMock);
    iamService.cache = claimCheckCacheMock;
    iamService.config = {
      claimPath: 'abcdefg',
    };
  });

  it('Should correctly return the claim check result received from the authority', async (): Promise<void> => {
    const result = await iamService.getFromAuthority('userId1', 'claim1');
    should(result).be.true();
  });

});
