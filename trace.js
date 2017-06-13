'use strict';

var chalk = require('chalk');
var P = require('bluebird');
P.longStackTraces();
process.on('unhandledRejection', err => {
  console.log(chalk.red(err.stack));
  process.exit(1);
});

