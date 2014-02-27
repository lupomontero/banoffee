# banoffee

[![NPM](https://nodei.co/npm/banoffee.png?compact=true)](https://nodei.co/npm/banoffee/)

[![Build Status](https://secure.travis-ci.org/lupomontero/banoffee.png)](http://travis-ci.org/lupomontero/banoffee) [![Dependency Status](https://david-dm.org/lupomontero/banoffee.png)](https://david-dm.org/lupomontero/banoffee)
[![devDependency Status](https://david-dm.org/lupomontero/banoffee/dev-status.png)](https://david-dm.org/lupomontero/banoffee#info=devDependencies)

`banoffee` is a test runner. It brings a few things together (WebDriver,
Selenium server, ChromeDriver, SauceLabs Connect, Mocha, ...) so you can easily
test your app on real browsers.

`banoffee` heavily relies on:

* [wd](https://github.com/admc/wd)
* [Mocha](https://github.com/visionmedia/mocha)
* [selenium-server-standalone](https://code.google.com/p/selenium/downloads/detail?name=selenium-server-standalone-2.39.0.jar)
* [chromedriver](https://code.google.com/p/selenium/wiki/ChromeDriver)
* [Sauce-Connect](https://saucelabs.com/docs/connect)

* * *

## Installation

```sh
npm install banoffee --save-dev
```

* * *

## Writing your tests

Lets say you put your tests in a `test/` directory inside your project. An
example file `test/index.spec.js` could look something like this:

```javascript
/*global browser, ports */

describe('homepage', function () {

  var url = 'http://localhost:'  + ports.www;

  beforeEach(function () {
    return browser.get(url);
  });

  it('should retrieve the page title', function () {
    return browser.title().should.become('The page title!');
  });

});
```

* * *

## Running your tests

Before you start running your tests you will probably need a configuration file
where you can tell `banoffee` where to find the files with your tests, what
Selenium server to connect to, what browsers to test on and so on.

### Configuration

Following the example above, we could add a `banoffee.conf.js` file in your
project's root. In this example we only specify the directory where `banoffee`
should look for tests, so everything else will use a default value:

```javascript
module.exports = {

  testDir: 'test'

};
```

An example `banoffee.conf.js` file using SauceLabs Sauce Connect:

```javascript
module.exports = {

  testDir: 'test',

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

### Command line

Ok, so now you have a test and a config file, so lets get cracking!

You can run your tests from the command line. Assuming you are in the root
directory of your project and that your `banoffee.conf.js` is in the current
directory, you can simply run:

```sh
./node_modules/banoffee/bin/banoffee
```

Without any arguments, `banoffee` looks for a `banoffee.conf.js` file in the
current working directory.

We can also specify the config file to use as an argument, so if we wanted to
have separate configs for develepment and continuous integration for example,
you could have two config files and run:

```sh
./node_modules/banoffee/bin/banoffee banoffee.dev.js
```

and

```sh
./node_modules/banoffee/bin/banoffee banoffee.continuous.js
```

### Node.js module

```javascript
var banoffee = require('banoffee');
var runner = banoffee();
runner.run();
```

* * *

## Notes

* [Chromedriver doesn’t run in tmux and here’s how to fix it](http://borkweb.com/story/chromedriver-doesnt-run-in-tmux)
* [Running Karma and Chrome under tmux on OSX](http://savanne.be/804-running-karma-and-chrome-under-tmux-on-osx/)

