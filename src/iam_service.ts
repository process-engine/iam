import {BadRequestError, ForbiddenError} from '@essential-projects/errors_ts';
import {IHttpClient, IRequestOptions, IResponse} from '@essential-projects/http_contracts';
import {IIAMConfiguration, IIAMService, IIdentity} from '@essential-projects/iam_contracts';

export class IAMService implements IIAMService {

  private httpClient: IHttpClient;
  private config: IIAMConfiguration;

  private httpResponseOkNoContentCode: number = 204;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public async ensureHasClaim(identity: IIdentity, claimName: string, claimValue?: string): Promise<void> {
    if (!identity) {
      throw new BadRequestError('No valid identity given');
    }

    if (!claimName || claimName === '') {
      throw new BadRequestError('No valid claimName given');
    }

    const requestAuthHeaders: IRequestOptions = {
      headers: {
        Authorization: `Bearer ${identity.token}`,
      },
    };

    let url: string = `${this.config.claimPath}/${claimName}`;

    if (claimValue) {
      url += `?claimValue=${claimValue}`;
    }

    const response: IResponse<any> = await this.httpClient.get<any>(url, requestAuthHeaders);

    if (response.status !== this.httpResponseOkNoContentCode) {
      throw new ForbiddenError('Identity does not have the requested claim!');
    }
  }
}
