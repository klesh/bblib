const readline = require('readline');
const P = require('bluebird');
const _ = require('lodash');

/**
 * process lines concurrently
 *
 * @param {ReadableStream} inputStream - stream to be read from
 * @param {function(line:string, cursor:number)} lineHandler
 * @param {number} [skip=0] - number of lines to be skipped
 * @param {boolean} [quiet=true] - suppress all errors threw by lineHandler
 */
async function process({inputStream, skip, lineHandler, quiet}) {
  skip = skip || 0;

  return await new P((resolve, reject) => {
    const reader = readline.createInterface({input: inputStream});
    const errors = [];
    let cursor = 0;
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
          inputStream.destroy();
        }
      } finally {
        if (++skip >= cursor) {
          if (errors.length) {
            const e = new Error('E_LINE_ERROR');
            e.lines = errors;
            e.getMinLineNo = function() {
              return _(this.lines).map(el => el.line).min();
            };
            reject(e);
          } else {
            resolve(skip);
          }
        }
      }
    });
  });
}

module.exports = process;
