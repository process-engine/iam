import {IIdentity} from '@essential-projects/iam_contracts';

export class Identity implements IIdentity {
  public token: string;

  constructor(token: string) {
    this.token = token;
  }
}
