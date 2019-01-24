import * as jsonwebtoken from 'jsonwebtoken';

import {BadRequestError} from '@essential-projects/errors_ts';
import {IIdentity, IIdentityService, TokenBody} from '@essential-projects/iam_contracts';

import {Identity} from './identity';

export class IdentityService implements IIdentityService {

  public getIdentity(token: string): Promise<IIdentity> {

    if (token === null) {
      throw new BadRequestError('Must provide a token by which to create an identity!');
    }

    // TODO: The dummy token check needs to be removed in the future!!
    try {
      const isDummyToken: boolean = Buffer.from(token, 'base64').toString() === 'dummy_token';
      if (isDummyToken) {
        return Promise.resolve(new Identity(token, 'dummy_token'));
      }
    } catch (error) {
      // do nothing
    }

    const decodedToken: TokenBody = <TokenBody> jsonwebtoken.decode(token);

    const identity: IIdentity = new Identity(token, decodedToken.sub);

    return Promise.resolve(identity);
  }
}
