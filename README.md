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

## sh
Wrap `child_process` to execute shell command

## ssh2
Wrap `ssh2` to provide ssh access

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

## RestClient
Wrap request to provide a general purpose RESTful client
```
var client = new RestClient({
   suppress: true,                              // suppress rejection while response status is not ok
   prefix: 'http://api.example.com',            // api url prefix
   beforeSend: async function(opts) {           // modify request options before sending, like adding signature
     opts.headers = {
       signature: await sign(opt.form)
     };
   },
   afterReceive: function(resp) {               // reject with a custom error while status code is not 200
     if (resp.status !== 200)
       return P.reject(new MyOwnError('request error'));
   }
})

// or:

var client = new RestClient({ suppress: true });
client.prefix = 'https://api.example.com';
client.beforeSend = function(options) {  };

// then:

async function madin() {
  var getQuery = { page: 2 };
  var list = await client.get('/orders', getQuery);
  if (list['error'])
    throw new Error(list['message']);

  console.log(list.body['data']);

  var postJson = { name: 'John Doe', phone: '94823944', ... };
  var postQuery = { overwrite: true };
  var created = await client.post('/orders', postJson, postQuery);
  if (created['error'])
    throw new Error(created['message']);

  console.log(created.body.data.id);

  try {
    client.suppress = false;
    await client.get('/path/some/error');
  } catch (e) {
    console.log(e.response.body.message);
  }
}
```

# Contribution

You are more than welcome to contribute by sending Pull Request.
