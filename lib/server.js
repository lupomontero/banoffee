var fs = require('fs');
var path = require('path');
var util = require('util');
var cp = require('child_process');
var _ = require('lodash');


function Server(opt) {
  this.options = _.extend({
    vendorDir: path.join(__dirname, '../vendor')
  }, opt);
}

Server.prototype.stop = function (cb) {
  var child = this._process;
  child.once('close', function (code, signal) {
    cb();
  });
  child.kill('SIGINT');
};


function SeleniumServer(opt) {
  Server.call(this, opt);
}

util.inherits(SeleniumServer, Server);

SeleniumServer.prototype.start = function (cb) {
  var that = this;
  var vendorDir = that.options.vendorDir;
  var seleniumPath = path.join(vendorDir, 'selenium');
  var chromedriverPath = path.join(vendorDir, 'chromedriver');
  var jar = 'selenium-server-standalone-2.39.0.jar';
  var started = false;
  var logfile = path.join(that.options.logDir, 'selenium.log');
  var log = fs.createWriteStream(logfile);
  // Add installDir to PATH so that chromedriver can get picked up correctly.
  var PATH = chromedriverPath + ':' + process.env.PATH;
  var java = that._process = cp.spawn('java', [ '-jar', jar, '-debug' ], {
    cwd: seleniumPath,
    env: _.extend({}, process.env, { PATH: PATH })
  });

  java.stdout.on('data', function (chunk) {
    chunk = chunk.toString('utf8');
    if (started) { return; }
    if (/INFO - Started HttpContext\[\/wd,\/wd\]/i.test(chunk)) {
      started = true;
      cb();
    }
  });

  java.stdout.pipe(log);
  java.stderr.pipe(log);
};


function SauceServer(opt) {
  Server.call(this, opt);
}

util.inherits(SauceServer, Server);

/*
--readyfile $READY_FILE \
--tunnel-identifier $TRAVIS_JOB_NUMBER \
*/
SauceServer.prototype.start = function (cb) {
  var that = this;
  var bin = path.join(that.options.vendorDir, 'sauce/sc');
  var remote = that.options.remote || {};
  var logfile = path.join(that.options.logDir, 'sauce.log');
  var args = [ '-u', remote.user, '-k', remote.pwd, '--logfile', logfile ];
  var started = false;
  var sc = that._process = cp.spawn(bin, args);
  sc.stdout.on('data', function (chunk) {
    if (started) { return; }
    if (/Sauce Connect is up, you may start your tests\./i.test(chunk)) {
      started = true;
      cb();
    }
  });
};


//
// Public API
//

module.exports = function (opt) {
  if (/saucelabs\.com$/.test(opt.remote.hostname)) {
    return new SauceServer(opt);
  }
  return new SeleniumServer(opt);
};

module.exports.Server = Server;
module.exports.SeleniumServer = SeleniumServer;
module.exports.SauceServer = SauceServer;

