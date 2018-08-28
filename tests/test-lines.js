const should = require('should');
const textlines = require('../textlines');
const fs = require('../fs');
const path = require('path');

describe('lines', function() {
  it('burst', async function() {
    const lines = [];
    const total = await textlines({
      inputStream: fs.createReadStream(path.resolve(__dirname, 'textlines', 'nums.txt')),
      skip: 2,
      lineHandler: async line => {
        lines.push(line);
      }
    });
    should(lines.length).be.exactly(8);
    should(lines[0]).be.exactly('3');
    should(total).be.exactly(10);
  });

  it('error occurs during process', async function(){
    const lines = [];
    const p = textlines({
      inputStream: fs.createReadStream(path.resolve(__dirname, 'textlines', 'nums.txt')),
      lineHandler: async (line, no) => {
        lines.push(line);
        if (no > 2)
          throw new Error('test');
      }
    });
    const e = await should(p).be.rejectedWith('test');
    should(e.line).be.exactly(3);
    should(e.errors).be.ok();
  });

  it('quiet should ignore all errors', async function() {
    const total = await textlines({
      quiet: true,
      inputStream: fs.createReadStream(path.resolve(__dirname, 'textlines', 'nums.txt')),
      lineHandler: async () => {
        throw new Error('test');
      },
    });
    should(total).be.exactly(10);
  });
});
