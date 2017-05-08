'use strict';

const pfs = require('../fs.js');
const should = require('should');
const path = require('path');

describe('fs lib', function() {
  it('exists', async function() {
    var exists = await pfs.exists(__filename);
    should(exists).be.true();
    var doesntExists = await pfs.exists(path.resolve(__dirname, 'file_doesnt_exists.wtf'));
    should(doesntExists).be.false();
  });
});
