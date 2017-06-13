'use strict';

const b_fs = require('../fs.js');
const should = require('should');
const path = require('path');
const os = require('os');

describe('fs lib', function() {
  it('exists', async function() {
    var exists = await b_fs.exists(__filename);
    should(exists).be.true();
    var doesntExists = await b_fs.exists(path.resolve(__dirname, 'file_doesnt_exists.wtf'));
    should(doesntExists).be.false();
  });

  it('mkdirp/rmdirp', async function() {
    var dir1 = path.resolve(os.tmpdir(), 'mkdirp');
    var dir2 = path.resolve(dir1, 'rmdirp');
    await b_fs.mkdirp(dir1);
    await b_fs.mkdirp(dir2);
    var exists = await b_fs.exists(dir2);
    should(exists).be.true();
    var fp1 = path.resolve(dir1, 'a.txt');
    var fp2 = path.resolve(dir2, 'b.txt')
    var file1 = await b_fs.writeFile(fp1, 'foo');
    var file2 = await b_fs.writeFile(fp2, 'bar');

    await b_fs.rmdirp(dir1);
    exists = await b_fs.exists(dir1);
    should(exists).be.false();
  });
});
