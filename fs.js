const fs = require('fs');
const P = require('bluebird');
const tool = require('./lib/tool');
const path = require('path');
const debug = require('debug')('bblib:fs');
const stream = require('stream');

tool.promisifyCopy(fs, exports, {
  handlers: {
    exists: function(path) {
      return new P(function(resolve) {
        fs.exists(path, resolve);
      });
    }
  }
});

fs.promisifyAll(stream.prototype);

exports.mkdirp = function(dir) {
  return exports.stat(dir).then(function(stat) {
    if (stat.isDirectory())
      return;
    else
      return P.reject(new Error(`${dir} is existing, but not a directory`));
  }).catch(function(err) {
    if (err.code !== 'ENOENT')
      return P.reject(err);

    const parentDir = path.dirname(dir);
    return exports.mkdirp(parentDir).then(function() {
      debug('making dir: ', dir);
      return exports.mkdir(dir);
    });
  }).return(dir);
};

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
};
