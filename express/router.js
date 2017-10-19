'use strict';

var express = module.exports = require('express');

/**
 * @example
 * const router = module.exports = require('bblib/express/router.js')();
 *
 * router.mount('/auth', require('../../core/services/auth-service'), (route, AuthService) => {
 *   route.post('/signup', req => new AuthService(req).signUp(req.body));
 *   route.post('/signin', req => new AuthService(req).signIn(req.body));
 *   route.post('/signout', req => new AuthService(req).signOut(req.body));
 *   route.post('/forgotten', req => new AuthService(req).forgotten(req.body));
 *   route.post('/reset-password', req => new AuthService(req).resetPassword(req.body));
 * });
 *
 * // the promise resolved result will be saved to res.locals.data, you can then customize the output by express middleware
 *
 * app.use(function(req, res, next) {
 *   const {resolved, result} = res.locals;
 *   if (resolved) {
 *     if (result) {
 *       if (result instanceof Buffer) {
 *         res.type('application/octet-stream');
 *         res.end(result, 'binary');
 *       } else {
 *         res.json({code: 'SUCCESS', data: result});
 *       }
 *     }
 *   } else {
 *     next(new Error(404));
 *   }
 * });
 */
express.Router.mount = function(url, Service, mounter) {
  var route = express.Router();
  mounter(route, Service);
  this.use(url, route);
  for (var i = 0; i < route.stack.length; i++) {
    let stack = route.stack[i].route.stack;
    let last = stack[stack.length - 1];
    let handle = last.handle;
    last.handle = function(req, res, next) {
      var promise = handle(req, res, next);
      if (!promise.then)
        throw new Error('The handle must return a Promise instance.');

      promise.then(function(result) {
        res.locals.resolved = true;
        res.locals.result = result;
        next();
      }, next);
    };
  }
};

module.exports = express.Router;
