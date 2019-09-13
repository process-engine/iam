import {Logger} from 'loggerhythm';
import * as jsonwebtoken from 'jsonwebtoken';

import {BadRequestError} from '@essential-projects/errors_ts';
import {IIdentity, IIdentityService, TokenBody} from '@essential-projects/iam_contracts';

import {Identity} from './identity';

const logger = Logger.createLogger('processengine:iam:identity_service');

export class IdentityService implements IIdentityService {

  public getIdentity(token: string): Promise<IIdentity> {

    if (!token) {
      logger.error('No auth token provided!');
      throw new BadRequestError('Must provide a token by which to create an identity!');
    }

    try {
      const isDummyToken = Buffer.from(token, 'base64').toString() === 'dummy_token';
      if (isDummyToken) {
        return Promise.resolve(new Identity(token, 'dummy_token'));
      }
    } catch (error) {
      // do nothing
    }

    const decodedToken = <TokenBody> jsonwebtoken.decode(token);

    if (!decodedToken) {
      const errorMsg = 'The given token could not be parsed!';
      logger.error(errorMsg, token);

      const error = new BadRequestError(errorMsg);
      error.additionalInformation = {
        token: token,
        result: decodedToken,
      } as any; //eslint-disable-line

      throw error;
    }

    const identity = new Identity(token, decodedToken.sub);

    return Promise.resolve(identity);
  }

}
