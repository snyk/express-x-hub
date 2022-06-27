/*  eslint no-unused-expressions:0  */

'use strict';

const error = require('../lib/error');

describe('xhub.error', function () {
  it('should return an Error Object', function () {
    const err = error();
    err.should.be.an.instanceof(Error);
  });

  it('should return the correct status code', function () {
    const code = 400;
    const err = error(code);
    err.status.should.equal(code);
  });

  it('should return the message when sent', function () {
    const message = 'specific_error_message';
    const err = error(null, message);
    err.message.should.equal(message);
  });

  it('should use a standard http message when message is empty', function () {
    const code = 400;
    const http = require('http');
    const message = http.STATUS_CODES[code];
    const err = error(code);
    err.message.should.equal(message);
  });
});
