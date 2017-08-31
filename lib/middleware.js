'use strict';

var rawbody = require('raw-body');
var typeis = require('type-is');
var jparse = require('./jparse');
var Signature = require('./signature');

module.exports = function(options){
    options = options || {};
    var strict = options.strict !== false;
    var reviver = options.reviver;
    var encoding = options.encoding || 'utf8';
    var defaultAlgorithm = options.algorithm || 'sha1';
    var defaultSecret = options.secret;
    var limit = options.limit || '100kb';

    return function(req, res, next) {
        // Assume Its Not XHub Until It Is...
        req.isXHub = false;

        // ExpressJS Pipeline
        if (req._body) { return next(); }
        req.body = req.body || {};
        if (!typeis(req, 'json')) { return next(); }

        // X-Hub Check
        var xHubSignature = req.header('X-Hub-Signature');
        if(!xHubSignature) { return next(); }

        // Flag As Parsed (ExpressJS) -- Everything is here.
        req._body = true;

        // Mark As XHub
        req.isXHub = true;

        var length = req.header('content-length');

        var rawOptions = {
            length: length,
            limit: limit,
            encoding: encoding
        };

        rawbody(req, rawOptions, function(err, buffer){
            if (err) { return next(err); }

            // Attach Signature Toolchain
            req.isXHubValid = function(
                    secret = defaultSecret,
                    algorithm = defaultAlgorithm) {
                var signature = new Signature(xHubSignature, secret, algorithm);
                return signature.isValid(buffer);
            }

            // ExpressJS-Style JSON Parse
            try {
                var parseOptions = { strict: strict, reviver: reviver };
                req.body = jparse(buffer, parseOptions);
            }
            catch (error){
                error.body = buffer;
                error.status = 400;
                return next(error);
            }
            next();
        });
    };
};
