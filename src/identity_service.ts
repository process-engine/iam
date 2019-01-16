import {BadRequestError} from '@essential-projects/errors_ts';
import {IIdentity, IIdentityService} from '@essential-projects/iam_contracts';

import {Identity} from './identity';

export class IdentityService implements IIdentityService {

  public getIdentity(token: string): Promise<IIdentity> {

    if (token === null) {
      throw new BadRequestError('Must provide a token by which to create an identity!');
    }

    const identity: IIdentity = new Identity(token);

    return Promise.resolve(identity);
  }
}
