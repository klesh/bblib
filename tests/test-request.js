'use strict';

const b_request = require('../request');
const http = require('http');
const should = require('should');

describe('request lib', function() {
  const port = 39472;
  const server = http.createServer((req, res) => {
    res.end('hi');
  });

  server.listen(port);

  it('request general', async function() {
    const res = await b_request(`http://localhost:${port}`);
    should(res.body).be.exactly('hi');
    should(res.statusCode).be.exactly(200);
  });
});

