'use strict';

const {
  IAMService,
  IdentityService,
} = require('./dist/commonjs/index');

function registerInContainer(container) {

  container.register('IAMService', IAMService)
    .dependencies('HttpService')
    .singleton();

  container.register('IdentityService', IdentityService)
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
