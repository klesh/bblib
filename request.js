const request = require('request');
const tool = require('./lib/tool');
const P = require('bluebird');

module.exports = tool.promisifyCopy(request, P.promisify(request));
