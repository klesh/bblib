'use strict';

var debug = require('debug')('bblib:ssh2');
var P = require('bluebird');
var SFTPWrapper = require('ssh2/lib/SFTPWrapper.js');
var fs = require('../fs');
var tool = require('../lib/tool');

/**
 *
 *  method reference: https://github.com/mscdex/ssh2/blob/master/lib/SFTPWrapper.js
 */
class Sftp {
  constructor(client) {
    this.client = client;
  }

  start() {
    var self = this;
    return this._starting = this._starting || this.client._ssh.sftpAsync().then(sftp => {
      this._sftp = sftp;
      return self;
    });
  }

  end() {
    if (this._sftp) {
      this._sftp.end();
      delete this._sftp;
      delete this._starting;
    }
    return P.resolve();
  }
}


tool.promisifyBind(Sftp.prototype, SFTPWrapper.prototype, { prop: '_sftp' });

module.exports = Sftp;
