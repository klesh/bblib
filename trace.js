const chalk = require('chalk');
const P = require('bluebird');
P.longStackTraces();
process.on('unhandledRejection', err => {
  console.log(chalk.red(err.stack));
  process.exit(1);
});

