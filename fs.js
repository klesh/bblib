'use strict';

var fs = require('fs');
var P = require('bluebird');
var tool = require('./lib/tool');
var path = require('path');
var debug = require('debug')('bblib:fs');

tool.promisifyCopy(fs, exports, {
  handlers: {
    exists: function(path) {
      return new P(function(resolve) {
        fs.exists(path, resolve);
      });
    }
  }
});

exports.mkdirp = function(dir) {
  return exports.stat(dir).then(function(stat) {
    if (stat.isDirectory())
      return;
    else
      return P.reject(new Error(`${dir} is existing, but not a directory`));
  }).catch(function(err) {
    if (err.code !== 'ENOENT')
      return P.reject(err);

    var parentDir = path.dirname(dir);
    return exports.mkdirp(parentDir).then(function() {
      debug('making dir: ', dir);
      return exports.mkdir(dir);
    });
  }).return(dir);
}

exports.rmdirp = function(dir) {
  return exports.stat(dir).then(function(stat) {
    if (!stat.isDirectory())
      return exports.unlink(dir);

    return exports.readdir(dir).each(function(file) {
      return exports.rmdirp(path.resolve(dir, file));
    }).then(function() {
      return exports.rmdir(dir);
    });
  }).catch(function(err) {
    if (err.code !== 'ENOENT')
      return P.reject(err);
  }).return(dir);
}
