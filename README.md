# banoffee [![Build Status](https://secure.travis-ci.org/lupomontero/banoffee.png)](http://travis-ci.org/lupomontero/banoffee) [![Dependency Status](https://david-dm.org/lupomontero/banoffee.svg?theme=shields.io)](https://david-dm.org/lupomontero/banoffee)

`banoffee` is a test runner. It brings a few things together (Selenium server,
ChromeDriver, SauceLabs Connect, Mocha, ...) so you can easily test your app on
real browsers.

## Installation

```sh
npm install banoffee --save-dev
```

### Writing your tests

### Running your tests

#### Configuration

An example `banoffee.conf.js` file using all defaults:

```javascript
module.exports = {};
```

An example `banoffee.conf.js` file using SauceLabs Sauce Connect:

```javascript
module.exports = {

  remote: {
    hostname: 'ondemand.saucelabs.com',
    port: 80,
    user: '<YOUR-SAUCELABS-USERNAME>',
    pwd: '<YOUR-SAUCELABS-PASSWORD>'
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

#### Command line

```sh
# without options it looks for a `banoffee.conf.js` file in the current
# directory.
banoffee

# We can specify the config file to use as an argument.
banoffee ./test/e2e/banoffee.dev.js
```

#### Node.js module

```javascript
var banoffee = require('banoffee');
var runner = banoffee();
runner.run();
```

