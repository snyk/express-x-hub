'use strict';

const http = require('http');

module.exports = function (code, msg) {
  const err = new Error(msg || http.STATUS_CODES[code]);
  err.status = code;
  return err;
};
