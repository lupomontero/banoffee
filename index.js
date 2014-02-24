var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var async = require('async');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var SeleniumServer = require('./lib/selenium');
var SauceServer = require('./lib/sauce');

var defaults = {
  testDir: '',
  logDir: 'log',
  testSuffix: '.spec.js',
  sauce: false,
  remote: {
    hostname: '127.0.0.1',
    port: 4444
  },
  platforms: [
    { browserName: 'chrome' }
  ]
};

function Runner(opt) {
  if (typeof opt === 'string') {
    // If `opt` argument is a string we assume this is a path to a file with the
    // config options.
    this.confFile = opt;
    this.confPath = path.dirname(this.confFile);
    this.options = _.extend({}, defaults, require(this.confFile));
    this.options.testDir = path.resolve(this.confPath, this.options.testDir);
    this.options.logDir = path.resolve(this.confPath, this.options.logDir);
  } else {
    this.options = _.extend({}, defaults, opt);
  }

  var remote = this.options.remote || {};
  if (/saucelabs\.com$/.test(remote.hostname)) {
    this.options.sauce = true;
  }

  // Deps dir is not optionsl!
  this.options.depsDir = path.resolve(__dirname, 'deps');

  mkdirp.sync(this.options.logDir);
  mkdirp.sync(this.options.depsDir);
}

Runner.prototype.run = function () {
  var runner = this;
  var opt = this.options;

  async.series([
    runner.loadTests.bind(runner),
    runner.startSelenium.bind(runner),
    function (cb) {
      // Run tests on each platform.
      async.eachSeries(opt.platforms, function (platform, cb) {
        var child = cp.fork(path.join(__dirname, 'lib', 'child'));
        child.on('close', function () { cb(); });
        child.send({
          type: 'init',
          remote: opt.remote,
          platform: platform,
          tests: runner.tests
        });
      }, cb);
    },
    runner.stopSelenium.bind(runner)
  ], function (err) {
    if (err) { return console.error(err); }
    console.log('Done running tests on all platforms!');
  });
};

Runner.prototype.loadTests = function (cb) {
  var runner = this;
  var opt = this.options;
  fs.readdir(opt.testDir, function (err, files) {
    if (err) { return cb(err); }
    runner.tests = files.filter(function (file) {
      return file.substr(-1 * opt.testSuffix.length) === opt.testSuffix;
    }).map(function (file) {
      return path.join(opt.testDir, file);
    });
    cb(null, runner.tests);
  });
};

Runner.prototype.startSelenium = function (cb) {
  if (this.options.sauce) {
    this.startSauceSelenium(cb);
  } else {
    this.startLocalSelenium(cb);
  }
};

Runner.prototype.startLocalSelenium = function (cb) {
  var selenium = this.selenium = new SeleniumServer(this.options);
  selenium.install(function (err) {
    selenium.start(cb);
  });
};

Runner.prototype.startSauceSelenium = function (cb) {
  var selenium = this.selenium = new SauceServer(this.options);
  selenium.install(function (err) {
    selenium.start(cb);
  });
};

Runner.prototype.stopSelenium = function (cb) {
  this.selenium.stop(cb);
};

module.exports = Runner;

