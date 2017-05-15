'use strict';

var request = require('./request');
var P = require('bluebird');
var _ = require('lodash');
var debug = require('debug')('rest');

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
    // clean up defaults by moving options for RestClient only from defaults to `this`
    var self = this;
    _.each(['prefix', 'beforeSend', 'afterReceive', 'suppress'], function(name) {
      self[name] = self.defaults[name];
      delete self.defaults[name];
    });
  }

  getContentType(res) {
    var contentType = res.headers['content-type'] || '';
    return contentType.split(';')[0];
  }

  wrapRequest(opts) {
    if (!opts.url)
      return P.reject(new Error('opts.url can not be empty'));

    var self = this, options = {};
    _.defaultsDeep(options, opts, self.defaults);

    options.url = self.prefix + opts.url;

    var p = P.resolve();

    if (this.beforeSend) {
      p = p.then(function() {
        return self.beforeSend(options);
      }).then(newOptions => {
        return options = newOptions || options;
      });
    }

    p = p.then(function() {
      debug('sending: ');
      debug(options);
      return request(options);
    }).tap(function(resp) {
      debug('receiving: %s %s  status code: %s', options.method, resp.request.uri.href, resp.statusCode);
    });

    if (self.afterReceive) {
      p = p.then(function(resp) {
        return P.resolve(self.afterReceive(resp)).then(function(newResp) {
          return newResp || resp;
        });
      });
    }

    p = p.tap(function(resp) {
      resp.body = self.parseBody(self.getContentType(resp), resp.body);

      if (!self.suppress && (resp.statusCode < 200 || resp.statusCode >= 300) ) {
        var e = new Error(resp.statusMessage);
        e.response = resp;
        e.isOperational = true;
        return P.reject(e);
      }
    });

    return p;
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
  get(url, qs) {
    return this.wrapRequest({
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
  post(url, json, qs) {
    return this.wrapRequest({
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
  put(url, json, qs) {
    return this.wrapRequest({
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
  delete(url, qs) {
    return this.wrapRequest({
      method: 'DELETE',
      url,
      qs
    });
  }
}

module.exports = RestClient;
