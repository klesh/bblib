const P = require('bluebird');

// break down Promise Chain for a infinite loop
module.exports = function(checker, interval = 10*1000) {
  return new P((resolve, reject) => {
    function loop() {
      checker().then(result => {
        if (result)
          resolve(result);
        else
          P.delay(interval).then(loop);
      }).catch(reject);
    }

    loop();
  });
};
