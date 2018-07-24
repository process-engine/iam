'use strict';

const {
  IAMService,
  IdentityService,
} = require('./dist/commonjs/index');

function registerInContainer(container) {

  container.register('IamService', IAMService)
    .dependencies('HttpService')
    .configure('iam:iam_service')
    .singleton();

  container.register('IdentityService', IdentityService)
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
