/*  eslint no-unused-expressions:0  */

'use strict';

const middleware = require('../lib/middleware');
const Readable = require('stream').Readable;

const createRequest = function (signature, type, body, length) {
  const req = new Readable();
  req.headers = {
    'content-type': type || 'application/json',
    'transfer-encoding': 'chunked',
    'X-Hub-Signature': signature,
    'content-length': length || (body ? body.length : 0),
  };
  req.header = function (name) {
    return this.headers[name];
  };
  req._read = function () {
    this.push(body);
    this.push(null);
  };
  return req;
};

describe('xhub.middleware', function () {
  it('should set isXHub to false when the request is not json', function (done) {
    const req = createRequest(null, 'application/xml');
    const middle = middleware();
    middle(req, null, function () {
      req.isXHub.should.be.false;
      done();
    });
  });

  it('should set isXHub to false is express has already flagged as parsed', function (done) {
    const req = createRequest();
    req._body = true;
    const middle = middleware();
    middle(req, null, function () {
      req.isXHub.should.be.false;
      done();
    });
  });

  it('should set isXHub to false when the xhub header is not in the request', function (done) {
    const req = createRequest();
    const middle = middleware();
    middle(req, null, function () {
      req.isXHub.should.be.false;
      done();
    });
  });

  it('should set express parsed flag when request is xhub', function (done) {
    const req = createRequest('signature');
    const middle = middleware();
    middle(req, null, function () {
      req._body.should.be.true;
      done();
    });
  });

  it('should set error when raw body is larger than the limit', function (done) {
    const limit = 1;
    const body = 'longer_than_the_limit';
    const req = createRequest('signature', null, body, limit);
    const middle = middleware();
    middle(req, null, function (err) {
      err.should.exist;
      done();
    });
  });

  it('should set attach xhub when the request is valid', function (done) {
    const body = 'body';
    const req = createRequest('signature', null, body);
    const middle = middleware();
    middle(req, null, function () {
      req.isXHubValid.should.exist;
      done();
    });
  });

  it('should parse valid json into the request body', function (done) {
    const body = '{ "hello": "world" }';
    const req = createRequest('signature', null, body);
    const middle = middleware();
    middle(req, null, function () {
      req.body.hello.should.equal('world');
      done();
    });
  });

  it('should error when parse invalid json', function (done) {
    const body = '{ invalid }';
    const req = createRequest('signature', null, body);
    const middle = middleware();
    middle(req, null, function (err) {
      err.should.exist;
      done();
    });
  });

  it('should set the error status when parse invalid json', function (done) {
    const body = '{ invalid }';
    const req = createRequest('signature', null, body);
    const middle = middleware();
    middle(req, null, function (err) {
      err.status.should.equal(400);
      done();
    });
  });

  // End-To-End Tests

  it('should not return an error when the request is correct', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature = 'sha1=c1a072c0aca15c6bd2f5bfae288ff8420e74aa5e';
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'my_little_secret',
    });
    middle(req, null, function (err) {
      global.should.not.exist(err);
      done();
    });
  });

  it('should set isXHub to true when the request is x-hub', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature = 'sha1=c1a072c0aca15c6bd2f5bfae288ff8420e74aa5e';
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'my_little_secret',
    });
    middle(req, null, function () {
      req.isXHub.should.be.true;
      done();
    });
  });

  it('should set isXHub to false when the request is not x-hub', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature = null;
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'my_little_secret',
    });
    middle(req, null, function () {
      req.isXHub.should.be.false;
      done();
    });
  });

  it('should set isXHubValid to true when the request signature is valid ', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature = 'sha1=c1a072c0aca15c6bd2f5bfae288ff8420e74aa5e';
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'my_little_secret',
    });
    middle(req, null, function () {
      req.isXHubValid().should.be.true;
      done();
    });
  });

  it('should set isXHubValid to false when the request signature is invalid ', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature = 'sha1=invalid_req_signature';
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'my_little_secret',
    });
    middle(req, null, function () {
      req.isXHubValid().should.be.false;
      done();
    });
  });

  it('isXHubValid should return true when the request signature is valid with a rutime secret', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature = 'sha1=c1a072c0aca15c6bd2f5bfae288ff8420e74aa5e';
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'something_totaly_different',
    });
    middle(req, null, function () {
      req.isXHubValid('my_little_secret').should.be.true;
      done();
    });
  });

  it('isXHubValid should return true when the request signature is valid with a rutime secret and algorithm', function (done) {
    const body = '{ "id": "realtime_update" }';
    const xhubSignature =
      'sha256=decf543653bf6ddb5b4efe6e48f7814b3376f1f8737c52dfdc412b923f5301ef';
    const req = createRequest(xhubSignature, null, body);
    const middle = middleware({
      algorithm: 'sha1',
      secret: 'my_little_secret',
    });
    middle(req, null, function () {
      req.isXHubValid('something_totaly_different', 'sha256').should.be.true;
      done();
    });
  });
});
