'use strict';

const {
  IAMService,
  IdentityService,
} = require('./dist/commonjs/index');

function registerInContainer(container) {

  container.register('IamServiceNew', IAMService)
    .dependencies('HttpService')
    .configure('iam:iam_service')
    .singleton();

  container.register('IdentityServiceNew', IdentityService)
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
