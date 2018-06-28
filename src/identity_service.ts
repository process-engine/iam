import {IIdentity, IIdentityService} from '@essential-projects/iam_contracts';

import {Identity} from './identity';

export class IdentityService implements IIdentityService {

  public getIdentity(token: string): Promise<IIdentity> {

    if (token === null) {
      throw new Error('Cannot get Identity by token');
    }

    const identity: IIdentity = new Identity(token);

    return Promise.resolve(identity);
  }
}
