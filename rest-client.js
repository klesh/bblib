const request = require('./request');
const req = require('request');
const _ = require('lodash');
const debug = require('debug')('bblib:rest');

class RestClient {
  /**
   * @callback beforeSendCallback
   * @param {RequestOptions}  options
   * @return Promise<RequestOptions>
   */
  /**
   * @callback afterReceiveCallback
   * @param {Response}        resp
   * @return Promise<Response>
   */
  /**
   * default options for RestClient request
   * RequestOptions reference: https://www.npmjs.com/package/request#requestoptions-callback
   * @typedef {RequestOptions} RestClientOptions
   * @property {string}                           prefix            will bed prepended to url for every request
   * @property {boolean}                          [suppress=false]  suppress rejection while response status is not ok
   * @property {RestClient~beforeSendCallback}    [beforeSend]      being called before sending out request, you can modify request options here
   * @property {RestClient~afterReceiveCallback}  [afterReceive]    being called before returning response to caller, you can modify response object here
   */
  /**
   * @example
   * ```
   * var client = new RestClient({
   *    suppress: true,                              // suppress rejection while response status is not ok
   *    prefix: 'http://api.example.com',            // api url prefix
   *    beforeSend: async function(opts) {           // modify request options before sending, like adding signature
   *      opts.headers = {
   *        signature: await sign(opt.form)
   *      };
   *    },
   *    afterReceive: function(resp) {               // reject with a custom error while status code is not 200
   *      if (resp.status !== 200)
   *        return P.reject(new MyOwnError('request error'));
   *    }
   * })
   *
   * // or:
   *
   * var client = new RestClient({ suppress: true });
   * client.prefix = 'https://api.example.com';
   * client.beforeSend = function(options) {  };
   *
   * // then:
   *
   * async function madin() {
   *   var getQuery = { page: 2 };
   *   var list = await client.get('/orders', getQuery);
   *   if (list['error'])
   *     throw new Error(list['message']);
   *
   *   console.log(list.body['data']);
   *
   *   var json = { name: 'John Doe', phone: '94823944', ... };
   *   var qs = { overwrite: true };
   *   var created = await client.post('/orders', {qs, json});
   *   if (created['error'])
   *     throw new Error(created['message']);
   *
   *   console.log(created.body.data.id);
   *
   *   try {
   *     client.suppress = false;
   *     await client.get('/path/some/error', {keyword: 'hi'});
   *   } catch (e) {
   *     console.log(e.response.body.message);
   *   }
   * }
   * ```
   *
   * @param {RestClientDefaults}  defaults
   */
  constructor(defaults) {
    this.defaults = _.defaultsDeep({}, defaults, {
      method: 'GET',
      useQuerystring: true
    });
    const keys = ['prefix', 'beforeSend', 'afterReceive', 'suppress'];
    for (let key of keys) {
      if (!(key in this.defaults))
        continue;

      this[key] = this.defaults[key];
      delete this.defaults[key];
    }
  }

  getContentType(res) {
    const contentType = res.headers['content-type'] || '';
    return contentType.split(';')[0];
  }

  async send(opts) {
    let options = _.defaultsDeep({}, opts, this.defaults);


    if (this.beforeSend) {
      await this.beforeSend(options);
    }
    options.url = this.prefix + options.url;

    debug('sending: ');
    debug(options);
    if (opts.stream) {
      debug('streaming mode');
      return req(options);
    }
    const resp = await request(options);
    debug('receiving: %s %s  status code: %s', options.method, resp.request.uri.href, resp.statusCode);
    debug(resp.body);

    if (this.afterReceive)
      await this.afterReceive(resp);

    if (opts.stream) {
      return resp;
    } else {
      resp.body = this.parseBody(this.getContentType(resp), resp.body);
      if (!this.suppress && (resp.statusCode < 200 || resp.statusCode >= 300) ) {
        const e = new Error(resp.statusMessage);
        e.response = resp;
        e.isOperational = true;
        throw e;
      }
    }

    return resp;
  }

  parseBody(contentType, body) {
    if (_.isString(body) === false)
      return body;

    switch(contentType) {
      case 'application/json':
        return JSON.parse(body);
      default:
        return body;
    }
  }

  /**
   * perform a GET request
   *
   * @param {string}  url       relative to prefix
   * @param {object}  qs        query object, ie: { page: 1, names: [ 'a', 'b', 'c' ] }
   * @param {object}  opts
   */
  async get(url, qs, opts) {
    return await this.send(_.assign({method: 'GET', url, qs}, opts));
  }

  /**
   * perform a POST request
   * @param {string}  url
   * @param {object}  opts
   */
  async post(url, opts) {
    return await this.send(_.assign({method: 'POST', url}, opts));
  }

  /**
   * perform a PUT request
   * @param {string}  url
   * @param {object}  opts
   */
  async put(url, opts) {
    return await this.send(_.assign({method: 'PUT', url}, opts));
  }

  /**
   * perform a DELETE request
   * @param {string}  url
   * @param {object}  qs
   * @param {object}  opts
   */
  async delete(url, qs, opts) {
    return await this.send(_.assign({method: 'DELETE', url, qs}, opts));
  }
  /**
   * perform a DELETE request
   * @param {string}  url
   */
  async head(url, opts) {
    return await this.send(_.assign({method: 'HEAD', url}, opts));
  }
}

module.exports = RestClient;
