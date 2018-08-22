const request = require('./request');
const P = require('bluebird');
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
   *   var postJson = { name: 'John Doe', phone: '94823944', ... };
   *   var postQuery = { overwrite: true };
   *   var created = await client.post('/orders', postJson, postQuery);
   *   if (created['error'])
   *     throw new Error(created['message']);
   *
   *   console.log(created.body.data.id);
   *
   *   try {
   *     client.suppress = false;
   *     await client.get('/path/some/error');
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
      this[key] = this.defaults[key];
      delete this.defaults[key];
    }
  }

  getContentType(res) {
    const contentType = res.headers['content-type'] || '';
    return contentType.split(';')[0];
  }

  async wrapRequest(opts) {
    if (!opts.url)
      return P.reject(new Error('opts.url can not be empty'));

    let options = _.defaultsDeep({}, opts, this.defaults);

    options.url = this.prefix + options.url;

    if (this.beforeSend) {
      await this.beforeSend(options);
    }

    debug('sending: ');
    debug(options);
    const resp = await request(options);
    debug('receiving: %s %s  status code: %s', options.method, resp.request.uri.href, resp.statusCode);
    debug(resp.body);

    if (this.afterReceive)
      await this.afterReceive(resp);

    resp.body = this.parseBody(this.getContentType(resp), resp.body);

    if (!this.suppress && (resp.statusCode < 200 || resp.statusCode >= 300) ) {
      const e = new Error(resp.statusMessage);
      e.response = resp;
      e.isOperational = true;
      throw e;
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
   */
  async get(url, qs) {
    return await this.wrapRequest({
      method: 'GET',
      url,
      qs
    });
  }

  /**
   * perform a POST request
   * @param {string}  url
   * @param {object}  json      post body
   * @param {object}  qs
   */
  async post(url, json, qs) {
    return await this.wrapRequest({
      method: 'POST',
      url,
      json,
      qs
    });
  }

  /**
   * perform a PUT request
   * @param {string}  url
   * @param {object}  json      post body
   * @param {object}  qs
   */
  async put(url, json, qs) {
    return await this.wrapRequest({
      method: 'PUT',
      url,
      json,
      qs
    });
  }

  /**
   * perform a DELETE request
   * @param {string}  url
   * @param {object}  qs
   */
  async delete(url, qs) {
    return await this.wrapRequest({
      method: 'DELETE',
      url,
      qs
    });
  }
}

module.exports = RestClient;
