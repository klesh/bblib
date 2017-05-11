'use strict';

var debug = require('debug')('bblib:ssh2');
var P = require('bluebird');
var Ssh2Client = require('ssh2').Client;
var Sftp = require('./sftp');

P.promisifyAll(Ssh2Client.prototype);

/**
 * Ssh2 wrapper
 */
class Client {
  /**
   * @typedef {object} Ssh2Options
   * @property {string} host
   * @property {number} port
   * @property {string} username
   * @property {string} [password]
   * @property {Buffer} [privateKey]
   */
  /**
   * @param {Ssh2Options} options
   */
  constructor(options) {
    if (!options)
      throw new Error('Ssh2Options is required');
    if (!options.username)
      throw new Error('options.username is required');
    if (!options.password && !options.privateKey)
      throw new Error('either options.password or privateKey should be supplied');

    options.port = options.port || 22;
    this.options = options;
  }

  _connect(retry) {
    var self = this;
    var options = self.options;
    retry = retry || 0;
    return new P(function(resolve, reject) {
      var ssh = new Ssh2Client();
      ssh.once('ready', () => {
        debug(`connected to %s@%s:%d`, options.username, options.host, options.port);
        resolve(ssh);
      });
      ssh.once('error', (e) => {
        debug(`connect to %s@%s:%d fail: %s`, options.username, options.host, options.port, e);
        reject(e);
      });
      ssh.once('end', () => debug('disconnected'));
      ssh.connect(self.options);
    }).catch(e => {
      if (retry-- > 0) {
        console.log('retry to connect to %s@%s:%d %d times left', options.username, options.host, options.port, retry);
        return self._connect(retry);
      }
      return P.reject(e);
    });
  }

  /**
   * disconnect and clean up
   */
  disconnect() {
    if (this._sftp) {
      this._sftp.end();
      delete this._sftp;
      delete this._sftping;
    }
    if (this._ssh) {
      this._ssh.end();
      delete this._ssh;
      delete this._connecting;
    }
  }


  /**
   * connect to ssh server
   */
  connect(retry) {
    var self = this;
    self.disconnect();
    return self._connecting = self._connecting || self._connect(retry).then(function(ssh) {
      self._ssh = ssh;
    });
  }

  /**
   * @typedef {object} Ssh2ExecOptions
   * @property {boolean}    pty
   * @property {string}     expect
   * @property {string}     send
   * @property {Regex}      failure
   * @property {string}     message
   */
  /**
   * execute command
   *
   * @param {string}              command
   * @param {Ssh2ExecOptions}     [options]
   *
   * @returns Promise<string>
   */
  exec(command, options) {
    var self = this;
    options = options || {};
    if ((command.startsWith('sudo ') || options.sudo) && this.options.password) {
      options.pty = true;
      options.expect = 'password';
      options.send = this.options.password + '\n';
      options.failure = /Sorry/;
      options.message = 'Password incorrect';
    }

    debug('input: ', command);
    return self._ssh.execAsync.apply(self._ssh, [command, options]).then(function(stream) {
      return new P(function(resolve, reject) {
        var stdout = '', stderr = '', sent = false;
        stream.on('data', function(data) {
          var text = data.toString();
          stdout += text;
          debug('stdout: ', text);

          if (options.expect) {
            if (sent) {
              if (options.failure.test(text))
                reject(new Error(options.message));
            } else if (~data.indexOf(options.expect)) {
              stream.write(options.send);
              stdout = '';
              sent = true;
            }
          }
        }).on('close', function(code, signal) {
          if (code) {
            var err = new Error(stderr);
            err.code = code;
            err.signal = signal;
            reject(err);
          } else {
            resolve(stdout.trim());
          }
        }).stderr.on('data', function(data) {
          var text = data.toString();
          stdout += text;
          debug('stderr: ', text);
        });
      });
    });
  }

  sftp() {
    var self = this;
    return self._sftping = self._sftping || new Sftp(self).start().then(function(sftp) {
      return self._sftp = sftp;
    });
  }
}

exports.Client = Client;
