'use strict';

const prompt = require('prompt');
const P = require('bluebird');
const _ = require('lodash');
P.promisifyAll(prompt);

prompt.colors = false;
prompt.message = '';

function promptGet(schema) {
  if (!prompt.started) {
    prompt.start();
  }
  return prompt.getAsync(schema);
}

function toggleColor(enable) {
  prompt.colors = enable;
}

function setPrompt(text) {
  prompt.message = text;
}


function confirm(description) {
  if (description && !_.endsWith(' [y/n]'))
    description += ' [y/n]';

  description = description ||  'Are you sure? [y/n]';
  return promptGet({
    properties: {
      confirmation: {
        description,
        type: 'string',
        pattern: /^\s*[y|n]\s*$/i
      }
    }
  }).then(answer => {
    if (answer.confirmation.toLowerCase() !== 'y')
      return P.reject(new Error('Operation cancelled'));
  })
}

promptGet.toggleColor = toggleColor;
promptGet.setPrompt = setPrompt;
promptGet.confirm = confirm;

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
