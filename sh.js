const P = require('bluebird');
const spawn = require('child_process').spawn;
const debug = require('debug')('bblib:sh');

function sh(cmd, args, opts) {
  return new P(function(resolve, reject) {
    const child = spawn(cmd, args, opts);

    debug('command: ', cmd, (args || []).join(' '));

    if (opts)
      debug('arguments: ', JSON.stringify(opts));

    const stdout = [], stderr = [];
    if (!opts || opts.stdio !== 'inherit') {
      child.stdout.on('data', function(data) {
        const text = data.toString();
        debug('stdout: ', text);
        if (opts && opts.onStdoutData)
          opts.onStdoutData(text, child);
        stdout.push(text);
      });
      child.stderr.on('data', function(data) {
        const text = data.toString();
        debug('stderr: ', text);
        if (opts && opts.onStderrData)
          opts.onStderrData(text, child);
        stderr.push(text);
      });
    }
    child.on('close', function(code) {
      if (code) {
        reject(new Error(stderr.join('')));
      } else {
        resolve(stdout.join(''));
      }
    });
  });
}

module.exports = sh;
