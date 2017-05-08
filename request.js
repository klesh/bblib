'use strict';

var request = require('request');
var tool = require('./lib/tool');
var P = require('bluebird');

module.exports = tool.promisifyCopy(request, P.promisify(request));
