'use strict';

const express = require('express');
const xhub = require('../lib/middleware');

const app = express();

// XHub Middleware Install
app.use(xhub({ secret: 'my_little_secret' }));

// Xhub Handler -- Could Be Any Route.
app.post('/xhub', function (req, res) {
  if (req.isXHub && req.isXHubValid()) {
    return res.json({ success: 'X-Hub Is Valid' });
  }
  return res.status(400).json({ error: 'X-Hub Is Invalid' });
});

const server = app.listen(3000, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log(
    'Example Express-X-Hub app listening at http://%s:%s',
    host,
    port,
  );
});
