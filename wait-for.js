'use strict';

const P = require('bluebird');

// break down Promise Chain for a infinite loop
module.exports = function(checker, delay = 10*1000) {
  return new P((resolve, reject) => {
    function loop() {
      checker().then(result => {
        if (result)
          resolve(result);
        else
          P.delay(delay).then(loop);
      }).catch(reject)
    }

    loop();
  });
}
