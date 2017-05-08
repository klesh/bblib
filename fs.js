'use strict';

var fs = require('fs');
var P = require('bluebird');
var tool = require('./lib/tool');

tool.promisifyCopy(fs, exports, {
  handlers: {
    exists: function(path) {
      return new P(function(resolve) {
        fs.exists(path, resolve);
      });
    }
  }
});
