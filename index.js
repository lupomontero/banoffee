var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var async = require('async');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var readdirp = require('readdirp');
var es = require('event-stream');

var SeleniumServer = require('./lib/selenium');
var SauceServer = require('./lib/sauce');


var defaults = {
  testDir: '',
  logDir: 'log',
  testSuffix: '*.spec.js',
  sauce: false,
  remote: {
    hostname: '127.0.0.1',
    port: 4444
  },
  platforms: [
    { browserName: 'chrome' }
  ]
};


module.exports = function (conf, cb) {
  var opt = _.extend({}, defaults, conf);

  var remote = opt.remote || {};
  if (/saucelabs\.com$/.test(remote.hostname)) {
    opt.sauce = true;
  }

  // Deps dir is not optional!
  opt.depsDir = path.resolve(__dirname, 'deps');

  mkdirp.sync(opt.logDir);
  mkdirp.sync(opt.depsDir);

  var tests, selenium, failures;

  function loadTests(cb) {
    readdirp({ root: opt.testDir, fileFilter: opt.testSuffix })
      .on('warn', function (err) { console.warn(err); })
      .on('error', cb)
      .pipe(es.writeArray(function (err, files) {
        if (err) { return cb(err); }
        tests = _.pluck(files, 'fullPath');
        cb();
      }));
  }

  function startSelenium(cb) {
    selenium = opt.sauce ? new SauceServer(opt) : new SeleniumServer(opt);
    selenium.install(function (err) {
      if (err) { return cb(err); }
      selenium.start(cb);
    });
  }

  function stopSelenium(cb) {
    selenium.stop(cb);
  }

  // Run tests on each platform.
  function runTests(cb) {
    async.eachSeries(opt.platforms, function (platform, cb) {
      var child = cp.fork(path.join(__dirname, 'lib', 'child'));
      child.on('close', function (code, signal) {
        failures = code;
        cb();
      });
      child.send({
        type: 'init',
        remote: opt.remote,
        platform: platform,
        tests: tests
      });
    }, cb);
  }

  async.series([
    loadTests,
    startSelenium,
    runTests,
    stopSelenium
  ], function (err) {
    if (err) { return cb(err); }
    cb(null, failures);
  });

};

