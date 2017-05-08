'use strict';

var fs = require('fs');
var P = require('bluebird');

for (var name in fs) {
  if (name === 'exists') {
    exports.exists = function(path) {
      return new P(function(resolve) {
        fs.exists(path, resolve);
      });
    }
    exports.exists.__isPromisified__ = true;
  } else if (typeof(fs[name]) === 'function') {
    exports[name] = P.promisify(fs[name]);
  }
}
