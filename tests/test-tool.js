'use strict';

const should = require('should');
const tool = require('../lib/tool');
const P = require('bluebird');

describe('tool', function() {
  it('primisifyCopy', async function() {
    function SubClass() {
    }
    var source = {
      foo: function(callback) { callback(null, 'foo') },
      bar: (callback) => callback(null, 'bar'),
      text: 'hi',
      SubClass,
      special: (callback) => callback('special')
    };

    var target = {};

    var ret = tool.promisifyCopy(source, target, {
      handlers: {
        special: () => {
          return new P(resolve => source.special(resolve))
        }
      }
    });

    debugger
    should(ret).be.exactly(target);
    should(target.text).be.exactly('hi');
    should(target.SubClass).be.exactly(source.SubClass);

    await target.foo().then(re => should(re).be.exactly('foo'));
    await target.bar().then(re => should(re).be.exactly('bar'));
    await target.special().then(re => should(re).be.exactly('special'));
  })
});
