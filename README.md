# banoffee [![Build Status](https://secure.travis-ci.org/lupomontero/banoffee.png)](http://travis-ci.org/lupomontero/banoffee) [![Dependency Status](https://david-dm.org/lupomontero/banoffee.svg?theme=shields.io)](https://david-dm.org/lupomontero/banoffee)

### Configuration

An example `banoffee.conf.js` file using all defaults:

```javascript
module.exports = {

  //remote: {
  //  hostname: '127.0.0.1',
  //  port: 4444
  //},

  //platforms: [
  //  { browserName: 'chrome' }
  //]

};
```

An example `banoffee.conf.js` file using SauceLabs Sauce Connect:

```javascript
module.exports = {

  remote: {
    hostname: '127.0.0.1',
    port: 4444,
    user: '',
    pwd: ''
  },

  platforms: [
    {
      browserName: 'chrome',
      version: '32',
      platform: 'Linux',
      tags: [ 'example' ],
      name: 'myapp e2e'
    },
    {
      browserName: 'firefox',
      version: '27',
      platform: 'Linux',
      tags: [ 'example' ],
      name: 'myapp e2e'
    }
  ]

};
```

### Command line

```sh
# without options it looks for a `banoffee.conf.js` file in the current
# directory.
banoffee

# We can specify the config file to use as an argument.
banoffee ./test/e2e/banoffee.dev.js
```

### Node.js module

```javascript
var banoffee = require('banoffee');
var runner = banoffee();
runner.run();
```


