'use strict';

const crypto = require('crypto');

const Signature = function (xhub, secret, algorithm) {
  this.xhub = xhub;
  this.algorithm = algorithm || 'sha1';
  this.secret = secret;
  this.isValid = isValid.bind(this);
};

function isValid(buffer) {
  if (!this.secret) {
    throw new Error('No Secret Found');
  }
  const hmac = crypto.createHmac(this.algorithm, this.secret);
  hmac.update(buffer, 'utf-8');
  const expected = this.algorithm + '=' + hmac.digest('hex');
  return this.xhub === expected;
}

module.exports = Signature;
