/*  eslint no-unused-expressions:0  */

'use strict';

var Signature = require('../lib/signature');
var sinon = require('sinon');

describe('xhub.signature', function(){

    it('should default to sha1 algorithm when not specified', function(){
        var sig = new Signature();
        sig.algorithm.should.equal('sha1');
    });

    it('should use a specific algorithm when specified', function(){
        var algorithm = 'md5';
        var sig = new Signature(null, null, algorithm);
        sig.algorithm.should.equal(algorithm);
    });

    it('should thow when isValid has no secret', function(){
        var sig = new Signature();
        (function(){ sig.isValid(); }).should.throw(Error, 'No Secret Found');
    });

    it('should return false when the signatures dont match', function(){
        var xhub = '123-signature';
        var secret = 'my_little_secret';
        var sig = new Signature(xhub, secret);
        sig.isValid('invalid-signature').should.be.false;
    });

    it('should return true when the signatures match', function(){
        var xhub = 'sha1=3dca279e731c97c38e3019a075dee9ebbd0a99f0';
        var secret = 'my_little_secret';
        var sig = new Signature(xhub, secret);
        sig.isValid('random-signature-body').should.be.true;
    });

    it('should return true when body contains UTF-8 chars and the signatures match', function(){
        var xhub = 'sha1=6eca52592dced2ec4b9c974538d6bb32e25ab897';
        var secret = 'my_little_secret';
        var sig = new Signature(xhub, secret);
        sig.isValid('random-utf-8-あいうえお-body').should.be.true;
    });

});
