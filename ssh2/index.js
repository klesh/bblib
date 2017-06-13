'use strict';

var debug = require('debug')('bblib:ssh2');
var P = require('bluebird');
var Ssh2Client = require('ssh2').Client;
var Sftp = require('./sftp');
var _ = require('lodash');

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
  constructor(options, defaultExecOptions) {
    if (!options)
      throw new Error('Ssh2Options is required');
    if (!options.username)
      throw new Error('options.username is required');
    if (!options.password && !options.privateKey)
      throw new Error('either options.password or privateKey should be supplied');

    options.port = options.port || 22;
    this.options = options;
    this.defaultExecOptions = defaultExecOptions;
    if (options.logger) {
      this.logger = options.logger;
      delete options.logger;
    } else {
      this.logger = debug;
    }
  }

  _connect(opts) {
    var self = this;
    var options = self.options;
    var logger = this.logger;
    opts = opts ? _.clone(opts) : {};
    opts.retry = opts.retry || 0;
    opts.delay = opts.delay || 0;
    return new P(function(resolve, reject) {
      var ssh = new Ssh2Client();
      ssh.once('ready', function() {
        logger(`connected to %s@%s:%d`, options.username, options.host, options.port);
        resolve(ssh);
      })
      ssh.once('error', function(e) {
        logger(`connect to %s@%s:%d fail: %s`, options.username, options.host, options.port, e);
        reject(e);
      });
      ssh.once('end', function() {
        logger('disconnected');
      })
      ssh.connect(self.options);
    }).catch(function(e) {
      if (opts.retry-- > 0) {
        var p = P.resolve();
        if (opts.delay)
          p = P.delay(opts.delay);
        logger('retry to connect to %s@%s:%d %d times left', options.username, options.host, options.port, opts.retry);
        return p.then(() => self._connect(opts));
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
  connect(opts) {
    var self = this;
    if (this._ssh) {
      return this;
    }
    return self._connecting = self._connecting || self._connect(opts).then(function(ssh) {
      self._ssh = ssh;
      return self;
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
    options = options ? _.clone(options) : {};
    if (this.defaultExecOptions)
      _.defaultsDeep(options, this.defaultExecOptions);
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
            if (options.retry-- > 0) { // retry...
              debug('exec err: ', stderr);
              debug(`retrying count down #${options.retry}`);
              var p = options.delay ? P.delay(options.delay) : P.resolve();

              p.then(() => {
                resolve(self.exec(command, options));
              });
            } else {
              var err = new Error(stderr);
              err.code = code;
              err.signal = signal;
              reject(err);
            }
          } else {
            resolve(stdout.trim());
          }
        }).stderr.on('data', function(data) {
          var text = data.toString();
          stderr += text;
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
