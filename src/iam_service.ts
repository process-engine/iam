import {BadRequestError, ForbiddenError} from '@essential-projects/errors_ts';
import {IHttpClient} from '@essential-projects/http_contracts';
import {IIAMConfiguration, IIAMService, IIdentity} from '@essential-projects/iam_contracts';

import {CacheValue, ClaimCheckCache} from './claim_check_cache';

export class IAMService implements IIAMService {

  private httpClient: IHttpClient;
  private config: IIAMConfiguration;

  private cache: ClaimCheckCache;

  private httpResponseOkNoContentCode: number = 204;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public async initialize(): Promise<void> {
    // TODO: Update @essential-projects/iam_contracts IIAMConfiguration type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.cache = new ClaimCheckCache((this.config as any).cache);
  }

  public async ensureHasClaim(identity: IIdentity, claimName: string, claimValue?: string): Promise<void> {

    if (this.config.disableClaimCheck === true) {
      return;
    }

    if (!identity) {
      throw new BadRequestError('No valid identity given!');
    }

    try {
      const isDummyToken = Buffer.from(identity.token, 'base64').toString() === 'dummy_token';
      if (isDummyToken) {
        return;
      }
    } catch (error) {
      // do nothing
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

    const response = await this.httpClient.get<any>(url, requestAuthHeaders);

    return response.status === this.httpResponseOkNoContentCode;
  }

}
