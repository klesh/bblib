const readline = require('readline');
const P = require('bluebird');
const _ = require('lodash');

/**
 * process lines concurrently
 *
 * @param {object} opts
 * @param {ReadableStream} opts.inputStream - stream to be read from
 * @param {function(line:string, cursor:number)} opts.lineHandler
 * @param {number} [opts.skip=0] - number of lines to be skipped
 * @param {boolean} [opts.quiet=false] - suppress all errors threw by lineHandler
 * @param {boolean} [opts.throttle=Number.MAX_VALUE] - close inputStream automatically
 */
async function process({inputStream, skip, lineHandler, quiet, throttle}) {
  skip = skip || 0;
  throttle = throttle || Number.MAX_VALUE;

  return await new P((resolve, reject) => {
    let cursor = 0;
    let concurrency = 0;
    const errors = [];

    const reader = readline.createInterface({input: inputStream});
    reader.on('line', async line => {
      if (cursor++ < skip || (!quiet && errors.length)) {
        return;
      }
      const lineNo = cursor;
      if (++concurrency > throttle) {
        reader.pause();
      }
      try {
        await lineHandler(line, cursor);
      } catch (e) {
        if (!quiet) {
          e.line = lineNo;
          errors.push(e);
          reader.close();
        }
      } finally {
        skip++;
        if (--concurrency < throttle) {
          reader.resume();
        }
      }
    }).on('close', async () => {
      while (skip < cursor)
        await P.delay(100);
      if (errors.length) {
        const e = _.minBy(errors, 'line');
        e.errors = errors;
        reject(e);
      } else {
        resolve(skip);
      }
    });
  });
}

module.exports = process;
