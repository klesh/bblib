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
 * @param {boolean} [opts.autoClose=true] - close inputStream automatically
 */
async function process({inputStream, skip, lineHandler, quiet}) {
  skip = skip || 0;

  return await new P((resolve, reject) => {
    let cursor = 0;
    const errors = [];

    const reader = readline.createInterface({input: inputStream});
    reader.on('line', async line => {
      if (cursor++ < skip || (!quiet && errors.length)) {
        return;
      }
      const lineNo = cursor;
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
      }
    }).on('close', async () => {
      while (skip < cursor)
        await P.delay(100);
      if (errors.length) {
        const e = new Error('E_LINE_ERROR');
        e.lines = errors;
        e.getMinLineNo = function() {
          return _(this.lines).map(le => le.line).min();
        };
        e.getInitialError = function() {
          let min = this.lines[0];
          _(this.lines).each(le => {
            if (le.line < min.line) {
              min = le;
            }
          });
          return min;
        };
        reject(e);
      } else {
        resolve(skip);
      }
    });
  });
}

module.exports = process;
