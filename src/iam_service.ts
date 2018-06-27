import {BadRequestError, ForbiddenError} from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {IIAMConfiguration, IIAMService, IIdentity, IIntrospectResponse} from '@essential-projects/iam_contracts';

export class IAMService implements IIAMService {

  private httpClient: IHttpClient;
  private credentials: string;
  private config: IIAMConfiguration;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public async initialize(): Promise<void> {
    const credentialString: string = `${this.config.clientId}:${this.config.clientSecret}`;
    this.credentials = btoa(credentialString);
  }

  public async ensureHasClaim(identity: IIdentity, claimName: string): Promise<void> {
    if (identity === null) {
      throw new BadRequestError('No valid identity given');
    }

    if (claimName === null || claimName === '') {
      throw new BadRequestError('No valid claimName given');
    }

    const response: IIntrospectResponse = await this.requestAllClaims(identity);

    let responseKeys: Array<string> = [];

    if (response) {
      responseKeys = Object.keys(response);
    }

    const hasClaim: boolean = responseKeys.includes(claimName);
    if (!hasClaim) {
      throw new ForbiddenError('Identity does not have the requested claim.');
    }
  }

  private async requestAllClaims(identity: IIdentity): Promise<IIntrospectResponse> {

    const requestAuthHeaders: IRequestOptions = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${this.credentials}`,
      },
    };

    const payload: any = {
      token: identity.token,
    };

    const response: IResponse<IIntrospectResponse> =
      await this.httpClient.post<any, IIntrospectResponse>(this.config.introspectPath, payload, requestAuthHeaders);

    return response.result;
  }
}
