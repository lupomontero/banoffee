var os = require('os');
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var async = require('async');
var _ = require('lodash');
var mkdirp = require('mkdirp');

var defaults = {
  depsDir: path.join(__dirname, './../deps')
};

function SeleniumServer(opt) {
  this.options = _.extend({}, defaults, opt);
  this.os = os.type();
  this.arch = os.arch();
  this.jar = 'selenium-server-standalone-2.39.0.jar';
  this.logfile = path.join(this.options.logDir, 'selenium.log');
  this.seleniumPath = path.join(this.options.depsDir, 'selenium');
  this.chromedriverPath = path.join(this.options.depsDir, 'chromedriver');
}

SeleniumServer.prototype.install = function (cb) {
  async.series([
    this._installChromeDriver.bind(this),
    this._installSeleniumServer.bind(this)
  ], cb);
};

SeleniumServer.prototype.start = function (cb) {
  var that = this;
  // Add installDir to PATH so that chromedriver can get picked up correctly.
  var PATH = that.chromedriverPath + ':' + process.env.PATH;
  var opt = { cwd: that.seleniumPath, env: _.extend({}, process.env, { PATH: PATH }) };
  var started = false;
  console.log('Initialising selenium server...');
  var log = fs.createWriteStream(that.logfile);
  var java = that._process = cp.spawn('java', [ '-jar', that.jar, '-debug' ], opt);
  java.stdout.on('data', function (chunk) {
    if (started) { return; }
    if (/INFO - Started org\.openqa\.jetty\.jetty\.Server/.test(chunk)) {
      started = true;
      cb();
    }
  });
  java.stderr.pipe(log);
  java.stdout.pipe(log);
};

SeleniumServer.prototype.stop = function () {
  var child = this._process;
  function waitAndCheck() {
    setTimeout(function () {
      if (child.killed) { return cb(); }
      waitAndCheck();
    }, 1000);
  }
  child.kill();
};

SeleniumServer.prototype._installChromeDriver = function (cb) {
  var that = this;
  var installDir = that.chromedriverPath;
  var bin = path.join(installDir, 'chromedriver');
  var baseurl = 'http://chromedriver.storage.googleapis.com/2.9/';
  var download = 'chromedriver_mac32.zip';

  if (that.os === 'Linux') {
    if (that.arch === 'x64') {
      download = 'chromedriver_linux64.zip';
    } else {
      download = 'chromedriver_linux32.zip';
    }
  }

  fs.exists(bin, function (exists) {
    if (exists) { return cb(); }
    console.log('ChromeDriver is not installed.');
    async.series([
      function (cb) {
        mkdirp(installDir, cb);
      },
      function (cb) {
        console.log('Downloading ChromeDriver...');
        var file = fs.createWriteStream(path.join(installDir, download));
        var curl = cp.spawn('curl', [ baseurl + download ]);
        curl.stdout.pipe(file);
        curl.on('close', function (code, signal) {
          if (code > 0) {
            return cb(new Error('Error downloading chromedriver!'));
          }
          cb();
        });
      },
      function (cb) {
        console.log('Extracting ' + download + '...');
        cp.exec('unzip ' + download, { cwd: installDir }, function (err, stdout, stderr) {
          if (err) { return cb(err); }
          cb();
        });
      },
      function (cb) {
        console.log('Cleaning up...');
        fs.unlink(path.join(installDir, download), cb);
      }
    ], cb);
  });
};

SeleniumServer.prototype._installSeleniumServer = function (cb) {
  var that = this;
  var installDir = that.seleniumPath;
  var baseurl = 'https://selenium.googlecode.com/files/';
  var download = that.jar;
  var jar = path.join(installDir, download);
  fs.exists(jar, function (exists) {
    if (exists) { return cb(); }
    console.log('Selenium server is not installed.');
    console.log('Downloading selenium server...');
    mkdirp.sync(installDir);
    var file = fs.createWriteStream(jar);
    var curl = cp.spawn('curl', [ baseurl + download ]);
    curl.stdout.pipe(file);
    curl.on('close', function (code, signal) {
      if (code > 0) {
        return new Error('Error downloading selenium server!');
      }
      cb();
    });
  });
};

module.exports = SeleniumServer;

