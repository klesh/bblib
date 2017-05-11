'use strict';

'use strict';

const prompt = require('prompt');
const P = require('bluebird');
P.promisifyAll(prompt);

prompt.colors = false;

function promptGet(schema) {
  if (!prompt.started) {
    prompt.start();
  }
  return prompt.getAsync(schema);
}

function toggleColor(enable) {
  prompt.colors = enable;
}

module.exports = promptGet;

if (require.main === module) {
  promptGet({
    properties: {
      abort: {
        pattern: /^[ynN]?$/,
        required: false,
        description: 'do you wish to abort operation (y/N)?',
        before: (b) => b === 'y'
      }
    }
  }).then(answer => {
    console.log(answer);
    /* { abort: xxx } */
  });
}
