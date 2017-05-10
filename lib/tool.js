'use strict';

var P = require('bluebird');
var cbPattern = /(function)?\s*\(([\w\s*,\s*])*\s*(callback|cb|callback_)\)\s*(\{|=>)/

P.longStackTraces();

/**
 * @typedef {object} PromisifyCopyOption
 * @property {object} handlers        special handle for odd Function, eg: fs.exists
 */
/**
 * copy all props from source to target, and promisify Callback Style Functions
 * @param {object}                    source
 * @param {object}                    target
 * @param {PromisifyCopyOption}       options
 * @return {object} target
 */
exports.promisifyCopy = function(source, target, options) {
  for (var name in source) {
    var value = source[name];
    if (options && options.handlers && (name in options.handlers)) {
      var handler = options.handlers[name];
      if (!handler)
        continue; // skip
      if (typeof(handler) === 'function')
        value = handler;
      else
        throw new Error('handler must be a function');
      if (value)
        value.__isPromisified__ = true;
    } else if (typeof(value) === 'function' && exports.fnHasCallback(value)) {
      value = P.promisify(value);
      value.__isPromisified__ = true;
    }
    target[name] = value;
  }
  return target;
}

/**
 * bind all props from source to target
 */
exports.promisifyBind = function(source, target, options) {
  if (!options)
    throw new Error('options is required');

  if (!options.prop)
    throw new Error('options.prop is required');

  var prop = options.prop;

  function mapMethod(name) {
    if (name in source)
      return;

    var value = target[name];

    if (typeof(value) === 'function') {
      if (exports.fnHasCallback(value)) {
        var asyncName = name + 'Async';
        source[name] = function() {
          return this[prop][asyncName].apply(this[prop], arguments);
        }
      } else {
        source[name] = function() {
          return this[prop][name].apply(this[prop], arguments);
        }
      }
    } else {
      source[name] = target[name];
    }
  }

  for (var name in target)
    mapMethod(name);

  P.promisifyAll(target);
}

exports.fnHasCallback = function(fn) {
  return cbPattern.test(fn.toString())
}
