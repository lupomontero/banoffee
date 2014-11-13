//
// Deps
//
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var readdirp = require('readdirp');
var es = require('event-stream');
var SeleniumServer = require('./lib/selenium');
var SauceServer = require('./lib/sauce');


//
// Default options
//
var defaults = {
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
  var files, server;
  var failures = 0;

  opt.depsDir = path.resolve(__dirname, 'deps');
  opt.testDir = path.resolve(process.cwd(), opt.testDir);
  opt.logDir = path.resolve(opt.testDir, 'log');

  function ensureDirs(cb) {
    fs.exists(opt.testDir, function (exists) {
      if (!exists) {
        return cb(new Error('testDir doesn\'t exist (' + opt.testDir + ').'));
      }
      fs.stat(opt.testDir, function (err, stats) {
        if (err) {
          return cb(err);
        } else if (!stats.isDirectory()) {
          return cb(new Error('testDir is not a directory (' + opt.testDir + ')'));
        }
        ee.emit('log', 'testDir: ' + opt.testDir);
        ee.emit('log', 'logDir: ' + opt.logDir);
        mkdirp(opt.logDir, cb);
      });
    });
  }

  // Read test directory and load all test files.
  function loadTests(cb) {
    readdirp({ root: opt.testDir, fileFilter: opt.testFilePattern })
      .on('warn', function (err) { ee.emit('warn', err); })
      .on('error', function (err) {
        cb(err);
      })
      .pipe(es.writeArray(function (err, array) {
        if (err) { return cb(err); }
        files = _.pluck(array, 'fullPath');
        if (!files.length) {
          return cb(new Error('No test files loaded'));
        }
        ee.emit('log', 'Loaded files: ' + files.join(', '));
        cb();
      }));
  }

  function startSelenium(cb) {
    var isSauce = /saucelabs\.com$/.test(opt.remote.hostname);
    server = isSauce ? new SauceServer(opt) : new SeleniumServer(opt);
    server.install(function (err) {
      if (err) { return cb(err); }
      server.start(cb);
    });
  }

  function stopSelenium(cb) {
    server.stop(function (code, signal) {
      //console.log(code, signal);
      cb();
    });
  }

  // Run tests on each platform.
  function runTests(cb) {
    async.eachSeries(opt.platforms, function (platform, cb) {
      ee.emit('log', 'Running tests on browser: ' + platform.browserName);
      var child = cp.fork(path.join(__dirname, 'lib', 'child'));
      child.on('close', function (code, signal) {
        failures += code;
        cb();
      });
      child.send({
        type: 'init',
        remote: opt.remote,
        platform: platform,
        files: files
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
    ee.emit('end', failures);
  });

  return ee;

};

