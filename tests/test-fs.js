const b_fs = require('../fs.js');
const should = require('should');
const path = require('path');
const os = require('os');

describe('fs lib', function() {
  it('exists', async function() {
    const exists = await b_fs.exists(__filename);
    should(exists).be.true();
    const doesntExists = await b_fs.exists(path.resolve(__dirname, 'file_doesnt_exists.wtf'));
    should(doesntExists).be.false();
  });

  it('mkdirp/rmdirp', async function() {
    const dir1 = path.resolve(os.tmpdir(), 'mkdirp');
    const dir2 = path.resolve(dir1, 'rmdirp');
    await b_fs.mkdirp(dir1);
    await b_fs.mkdirp(dir2);
    let exists = await b_fs.exists(dir2);
    should(exists).be.true();
    const fp1 = path.resolve(dir1, 'a.txt');
    const fp2 = path.resolve(dir2, 'b.txt');
    await b_fs.writeFile(fp1, 'foo');
    await b_fs.writeFile(fp2, 'bar');

    await b_fs.rmdirp(dir1);
    exists = await b_fs.exists(dir1);
    should(exists).be.false();
  });

  it ('promisified stream', async function() {
    const logPath = path.resolve(os.tmpdir(), 'alsdkgjasdf.log');
    const output = b_fs.createWriteStream(logPath);
    for (let i = 0; i < 1000; i++) {
      await output.writeAsync(i + '\n');
    }
    await output.endAsync();

    const all = await b_fs.readFile(logPath, {encoding: 'utf-8'});
    const lines = all.split('\n').filter(l => l).map(l => l * 1);
    for (let i = 0; i < 1000; i++) {
      should(lines[i]).be.exactly(i);
    }
  });
});
