'use strict';

var P = require('bluebird');
var cbPattern = /(function)?\s*\(([\w\s*,\s*])*\s*(callback)\)\s*(\{|=>)/

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
    } else if (typeof(value) === 'function' && cbPattern.test(value.toString())) {
      value = P.promisify(value);
      value.__isPromisified__ = true;
    }
    target[name] = value;
  }
  return target;
}
