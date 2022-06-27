'use strict';

const rawbody = require('raw-body');
const typeis = require('type-is');
const jparse = require('./jparse');
const Signature = require('./signature');

module.exports = function (options) {
  options = options || {};
  const strict = options.strict !== false;
  const reviver = options.reviver;
  const encoding = options.encoding || 'utf8';
  const defaultAlgorithm = options.algorithm || 'sha1';
  const defaultSecret = options.secret;
  const limit = options.limit || '100kb';

  return function (req, res, next) {
    // Assume Its Not XHub Until It Is...
    req.isXHub = false;

    // ExpressJS Pipeline
    if (req._body) {
      return next();
    }
    req.body = req.body || {};
    if (!typeis(req, 'json')) {
      return next();
    }

    // X-Hub Check
    const xHubSignature = req.header('X-Hub-Signature');
    if (!xHubSignature) {
      return next();
    }

    // Flag As Parsed (ExpressJS) -- Everything is here.
    req._body = true;

    // Mark As XHub
    req.isXHub = true;

    const length = req.header('content-length');

    const rawOptions = {
      length: length,
      limit: limit,
      encoding: encoding,
    };

    rawbody(req, rawOptions, function (err, buffer) {
      if (err) {
        return next(err);
      }

      // Attach Signature Toolchain
      req.isXHubValid = function (
        secret = defaultSecret,
        algorithm = defaultAlgorithm,
      ) {
        const signature = new Signature(xHubSignature, secret, algorithm);
        return signature.isValid(buffer);
      };

      // ExpressJS-Style JSON Parse
      try {
        const parseOptions = { strict: strict, reviver: reviver };
        req.body = jparse(buffer, parseOptions);
      } catch (error) {
        error.body = buffer;
        error.status = 400;
        return next(error);
      }
      next();
    });
  };
};
