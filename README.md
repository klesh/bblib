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
  var res = await request.get('https://www.google.com');

  console.log(`status: ${res.statusCode}`);
  console.log(`body  : ${res.body}`);
}

main();
```

# Contribution

You are more than welcome to add new libs by sending Pull Request.
