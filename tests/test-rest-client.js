const RestClient = require('../rest-client');
const http = require('http');
const should = require('should');
const url = require('url');
const querystring = require('querystring');
const sinon = require('sinon');
require('should-sinon');

describe('rest-client lib', function() {
  const port = 39473;
  const server = http.createServer((req, res) => {
    const u = url.parse(req.url);
    const q = querystring.parse(u.query);
    const b = [];

    if (u.path === '/error') {
      res.writeHead('400', {
        'Content-Type': 'application/json'
      });

      res.end(JSON.stringify({
        'error': '400',
        'message': 'error testing'
      }));

      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    const hasBody = req.method === 'POST' || req.method === 'PUT';

    const end = () => {
      res.end(JSON.stringify({
        'error': 0,
        'data': hasBody ? JSON.parse(b.join('')) : q
      }));
    };

    if (hasBody) {
      req.on('data', data => b.push(data.toString()));
      req.on('end', end);
    } else {
      end();
    }
  });

  server.listen(port);

  const beforeSend = sinon.spy();
  const afterReceive = sinon.spy();
  const client = new RestClient({
    prefix: `http://localhost:${port}`,
    beforeSend,
    afterReceive
  });
  it('get', async function() {
    const resp = await client.get('/', {names: ['a', 'b', 'c']});
    should(resp.body.error).be.exactly(0);
    should(resp.body.data.names).be.deepEqual(['a', 'b', 'c']);
    beforeSend.should.be.called();
    afterReceive.should.be.called();
  });

  it('post', async function() {
    const resp = await client.post('/', {
      'foo': 'bar'
    });

    should(resp.body.data).be.deepEqual({'foo': 'bar'});
  });

  it('put', async function() {
    const resp = await client.put('/', {
      'hello': 'world'
    });

    should(resp.body.data).be.deepEqual({'hello': 'world'});
  });

  it('delete', async function() {
    const resp = await client.delete('/', {
      'hi': 'world'
    });

    should(resp.body.data).be.deepEqual({'hi': 'world'});
  });

  it('error testing', async function() {
    try {
      await client.get('/error');
    } catch(e) {
      e.response.body.message.should.be.exactly('error testing');
    }
  });
});

