import {Logger} from 'loggerhythm';

import {BadRequestError, ForbiddenError} from '@essential-projects/errors_ts';
import {IHttpClient} from '@essential-projects/http_contracts';
import {IIAMConfiguration, IIAMService, IIdentity} from '@essential-projects/iam_contracts';

import {CacheValue, ClaimCheckCache} from './claim_check_cache';

const logger = Logger.createLogger('processengine:iam:iam_service');

export class IAMService implements IIAMService {

  private httpClient: IHttpClient;
  private config: IIAMConfiguration;

  private cache: ClaimCheckCache;

  private httpResponseUnauthorizedCode = 401;
  private httpResponseForbiddenCode = 403;
  private httpResponseOkNoContentCode = 204;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public async initialize(): Promise<void> {
    const cacheConfigToUse = this.config && this.config.cache
      ? this.config.cache
      : undefined;
    this.cache = new ClaimCheckCache(cacheConfigToUse);

    const isProductionNodeEnv = process.env.NODE_ENV && process.env.NODE_ENV.indexOf('test') === -1;
    const godTokenIsAllowed = this.config && this.config.allowGodToken;
    if (isProductionNodeEnv && godTokenIsAllowed) {
      // eslint-disable-next-line max-len
      logger.error('allowGodToken is set to true. This allows unauthorized access with no restrictions. Never use this setting in a production environment!');
    }
  }

  public async ensureHasClaim(identity: IIdentity, claimName: string, claimValue?: string): Promise<void> {

    if (this.config.disableClaimCheck === true) {
      return;
    }

    if (!identity) {
      throw new BadRequestError('No valid identity given!');
    }

    if (this.config.allowGodToken === true) {
      try {
        const isDummyToken = Buffer.from(identity.token, 'base64').toString() === 'dummy_token';
        if (isDummyToken) {
          return;
        }
      } catch (error) {
        // do nothing
      }
    }

    if (!claimName || claimName === '') {
      throw new BadRequestError('No valid claimName given!');
    }

    const userHasClaim = await this.checkIfUserHasClaim(identity, claimName, claimValue);

    if (!userHasClaim) {
      throw new ForbiddenError('Identity does not have the requested claim!');
    }
  }

  private async checkIfUserHasClaim(identity: IIdentity, claimName: string, claimValue?: string): Promise<boolean> {

    const resultFromCache = this.getFromCache(identity.userId, claimName);

    if (resultFromCache !== undefined) {
      return resultFromCache.userHasClaim;
    }

    const resultFromAuthority = await this.getFromAuthority(identity.token, claimName, claimValue);

    this.cache.add(identity.userId, claimName, resultFromAuthority);

    return resultFromAuthority;
  }

  private getFromCache(userId: string, claimName: string): CacheValue {

    if (!this.cache.enabled) {
      return undefined;
    }

    if (!this.cache.hasMatchingEntry(userId, claimName)) {
      return undefined;
    }

    return this.cache.get(userId, claimName);
  }

  private async getFromAuthority(token: string, claimName: string, claimValue?: string): Promise<boolean> {

    const requestAuthHeaders = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    let url = `${this.config.claimPath}/${claimName}`;

    if (claimValue) {
      url += `?claimValue=${claimValue}`;
    }

    try {
      const response = await this.httpClient.get(url, requestAuthHeaders);

      return response.status === this.httpResponseOkNoContentCode;
    } catch (error) {
      if (error.code === this.httpResponseForbiddenCode || error.code === this.httpResponseUnauthorizedCode) {
        return false;
      }

      logger.error('Failed to send Claim check request against the authority!', error.message, error.stack);
      throw error;
    }
  }

}
