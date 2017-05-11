# Introduction

Provide some promisified version (by bluebird) for some commonly used libs.


# Install

```bash
$ npm i bblib
```

# Usage

For Standard libs:
```js
const bfs = require('bblib/fs');

async function main() {
  var exists = await bfs.exists('/path/to/file');
  if (exists) {
    // do something
  }
}

main();
```
For npm packages:
bblib provide only the promisify script, so that you don't need to install all the packages.
in order to use promisified version of a npm package, you need to install it to your project manually.
for example, if you'd like to use promisified *request* lib:

1. install the request package by:
```bash
$ npm i request -S
```
2. use the promisified version in your code:
```js
const request = require('bblib/request');

async function main() {
  var res = await request('https://www.google.com');

  console.log(`status: ${res.statusCode}`);
  console.log(`body  : ${res.body}`);
}

main();
```

# Wrappers
Some libs were designed base on EvenEmitter, which can not be promisified simply. 
Here is the list or some useful libs

Same as before, you need to install the original package first by
```bash
$ npm i $PKG -S
```

## ssh2

Homepage: https://github.com/mscdex/ssh2

```
const Client = require('bblib/ssh2');

async function main() {
  var client = new Client({
    host: 'example.com',
    username: 'root',
    password: '******'
  });

  var retryCount = 10;
  try {
    await client.connect(retryCount);
  } catch (e) {
    ...
  }

  var files = await client.exec('ls');
  var sftp = await client.sftp();
  await sftp.writeFile('/path/to/files.log', files);
  client.disconnect();
}
```

# Contribution

You are more than welcome to contribute by sending Pull Request.
