import * as should from 'should';

import {BadRequestError, ForbiddenError} from '@essential-projects/errors_ts';

import {IAMService} from '../../dist/commonjs/iam_service';

import {ClaimCheckCacheMock, HttpClientMock} from '../mocks';

describe('IamService.ensureHasClaim()', (): void => {

  let iamService;

  const testIdentity = {
    userId: 'userId1',
    token: 'abcdefg',
  };

  beforeEach((): void => {
    const claimCheckCacheMock = new ClaimCheckCacheMock({enabled: true});
    const httpClientMock = new HttpClientMock();

    iamService = new IAMService(httpClientMock);
    iamService.cache = claimCheckCacheMock;
    iamService.config = {
      disableClaimCheck: false,
      allowGodToken: false,
    };

    iamService.checkIfUserHasClaim = async (): Promise<boolean> => Promise.resolve(true);
  });

  describe('Claim checks are enabled', (): void => {

    it('Should resolve without result, if the user has the claim', async (): Promise<void> => {
      const result = await iamService.ensureHasClaim(testIdentity, 'claim1');
      should.not.exist(result);
    });

    it('Should resolve without result, if the dummy token is used', async (): Promise<void> => {

      const dummyIdentity = {
        userId: 'userId1',
        token: 'ZHVtbXlfdG9rZW4=',
      };

      iamService.config.disableClaimCheck = true;
      const result = await iamService.ensureHasClaim(dummyIdentity, 'claim1');
      should.not.exist(result);
    });

    it('Should throw an error, if no identity was provided', async (): Promise<void> => {
      try {
        await iamService.ensureHasClaim(undefined, 'claim1');
      } catch (error) {
        const expectedError = new BadRequestError('No valid identity given!');
        should(error).be.eql(expectedError);
      }
    });

    it('Should throw an error, if no claim name was provided', async (): Promise<void> => {
      try {
        await iamService.ensureHasClaim(testIdentity);
      } catch (error) {
        const expectedError = new BadRequestError('No valid claimName given!');
        should(error).be.eql(expectedError);
      }
    });

    it('Should throw an error, if the claim check returns "false"', async (): Promise<void> => {
      try {
        iamService.checkIfUserHasClaim = async (): Promise<boolean> => Promise.resolve(false);
        await iamService.ensureHasClaim(testIdentity, 'claim1');
      } catch (error) {
        const expectedError = new ForbiddenError('Identity does not have the requested claim!');
        should(error).be.eql(expectedError);
      }
    });

  });

  describe('Claim checks are disabled', (): void => {

    it('Should resolve without result, even if invalid parameters are provided', async (): Promise<void> => {
      iamService.config.disableClaimCheck = true;
      const result = await iamService.ensureHasClaim();
      should.not.exist(result);
    });

    it('Should resolve without result', async (): Promise<void> => {
      iamService.config.disableClaimCheck = true;
      const result = await iamService.ensureHasClaim(testIdentity, 'claim1');
      should.not.exist(result);
    });

  });

  describe('God token is enabled', (): void => {

    it('Should throw an error, if invalid parameters are provided', async (): Promise<void> => {
      iamService.config.allowGodToken = true;
      try {
        await iamService.ensureHasClaim(undefined, 'claim1');
      } catch (error) {
        const expectedError = new BadRequestError('No valid identity given!');
        should(error).be.eql(expectedError);
      }
    });

    it('Should resolve without result', async (): Promise<void> => {
      iamService.config.allowGodToken = true;
      const result = await iamService.ensureHasClaim(testIdentity, 'claim1');
      should.not.exist(result);
    });

  });

});
