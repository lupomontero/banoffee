//
// Deps
//

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var EventEmitter = require('events').EventEmitter;

var async = require('async');
var _ = require('lodash');
var readdirp = require('readdirp');
var es = require('event-stream');

var SeleniumServer = require('./lib/selenium');
var SauceServer = require('./lib/sauce');


//
// Default options.
//
var defaults = {
  baseDir: '',
  testDir: 'test',
  testFilePattern: '*.spec.js',
  remote: {
    hostname: '127.0.0.1',
    port: 4444
  },
  platforms: [
    { browserName: 'chrome' }
  ]
};


//
// Public API
//
module.exports = function (options) {

  // Apply defaults to passed options.
  var opt = _.extend({}, defaults, options);

  var ee = new EventEmitter();
  var tests, selenium, failures;

  opt.depsDir = path.resolve(__dirname, 'deps');
  opt.testDir = path.resolve(opt.baseDir, opt.testDir);

  function ensureDirs(cb) {
    async.eachSeries([
      { name: 'baseDir', src: opt.baseDir },
      { name: 'testDir', src: opt.testDir }
    ], function (dir, cb) {
      fs.exists(dir.src, function (exists) {
        if (!exists) {
          return cb(new Error(dir.name + ' doesn\'t exist (' + dir.src + ').'));
        }
        fs.stat(dir.src, function (err, stats) {
          if (err) {
            return cb(err);
          } else if (!stats.isDirectory()) {
            return cb(new Error(dir.name + ' is not a directory (' + dir.src + ')'));
          }
          ee.emit('log', dir.name + ': ' + dir.src);
          cb();
        });
      });
    }, cb);
  }

  // Read test directory and load all test files.
  function loadTests(cb) {
    if (!fs.existsSync(opt))
    if (!fs.existsSync(opt.testDir)) {
      return cb(new Error('Test directory doesn\'t exist'));
    }
    readdirp({ root: opt.testDir, fileFilter: opt.testFilePattern })
      .on('warn', function (err) { ee.emit('warn', err); })
      .on('error', function (err) {
        cb(err);
      })
      .pipe(es.writeArray(function (err, files) {
        if (err) { return cb(err); }
        tests = _.pluck(files, 'fullPath');
        if (!tests.length) {
          return cb(new Error('No test files loaded'));
        }
        ee.emit('log', 'Loaded tests: ' + tests.join(', '));
        cb();
      }));
  }

  function startSelenium(cb) {
    var isSauce = /saucelabs\.com$/.test(opt.remote.hostname);
    selenium = isSauce ? new SauceServer(opt) : new SeleniumServer(opt);
    selenium.on('log', function (str) {
      //ee.emit('log', str);
    });
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
      ee.emit('log', 'Running tests on browser: ' + platform.browserName);
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
    ensureDirs,
    loadTests,
    startSelenium,
    runTests,
    stopSelenium
  ], function (err) {
    if (err) { 
      return ee.emit('error', err);
    }
    console.log('ending...');
    ee.emit('end', failures);
  });

  return ee;

};

