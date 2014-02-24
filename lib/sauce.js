var path = require('path');
var fs = require('fs');
var cp = require('child_process');
var async = require('async');
var _ = require('lodash');
var mkdirp = require('mkdirp');

var defaults = {
  depsDir: path.join(__dirname, 'deps')
};

function SauceServer(opt) {
  this.options = _.extend({}, defaults, opt);
  this.jar = 'Sauce-Connect.jar';
  this.saucePath = path.join(this.options.depsDir, 'sauce');
}

SauceServer.prototype.install = function (cb) {
  var that = this;
  var installDir = that.saucePath;
  var url = 'http://saucelabs.com/downloads/Sauce-Connect-latest.zip';
  var download = 'Sauce-Connect.zip';
  var jar = path.join(installDir, that.jar);
  fs.exists(jar, function (exists) {
    if (exists) { return cb(); }
    console.log('Sauce Connect is not installed.');
    async.series([
      function (cb) {
        mkdirp(installDir, cb);
      },
      function (cb) {
        console.log('Downloading Sauce Connect...');
        var file = fs.createWriteStream(path.join(installDir, download));
        var curl = cp.spawn('curl', [ url ]);
        curl.stdout.pipe(file);
        curl.on('close', function (code, signal) {
          if (code > 0) {
            return new Error('Error downloading Sauce Connect!');
          }
          cb();
        });
      },
      function (cb) {
        console.log('Extracting...');
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

/*
--readyfile $READY_FILE \
--tunnel-identifier $TRAVIS_JOB_NUMBER \
*/
SauceServer.prototype.start = function (cb) {
  console.log('Initialising sauce connect...');
  var that = this;
  var remote = that.options.remote || {};
  var logfile = path.join(that.options.logDir, 'sauce.log');
  var args = [ '-jar', that.jar, '--logfile', logfile, remote.user, remote.pwd ];
  var opt = { cwd: that.saucePath };
  var started = false;
  var java = this._process = cp.spawn('java', args, opt);
  java.stdout.on('data', function (chunk) {
    if (started) { return; }
    if (/Connected! You may start your tests\./.test(chunk)) {
      started = true;
      cb();
    }
  });
};

SauceServer.prototype.stop = function (cb) {
  var child = this._process;
  function waitAndCheck() {
    setTimeout(function () {
      if (child.killed) { return cb(); }
      waitAndCheck();
    }, 1000);
  }
  child.kill();
};

module.exports = SauceServer;

