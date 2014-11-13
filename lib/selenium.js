var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var _ = require('lodash');


var defaults = {
  vendorDir: path.join(__dirname, './../vendor')
};


function SeleniumServer(opt) {
  this.options = _.extend({}, defaults, opt);
  this.jar = 'selenium-server-standalone-2.39.0.jar';
  this.seleniumPath = path.join(this.options.vendorDir, 'selenium');
  this.chromedriverPath = path.join(this.options.vendorDir, 'chromedriver');
}

SeleniumServer.prototype.start = function (cb) {
  var that = this;
  // Add installDir to PATH so that chromedriver can get picked up correctly.
  var PATH = that.chromedriverPath + ':' + process.env.PATH;
  var opt = { cwd: that.seleniumPath, env: _.extend({}, process.env, { PATH: PATH }) };
  var started = false;
  var logfile = path.join(that.options.logDir, 'selenium.log');
  var log = fs.createWriteStream(logfile);
  var java = that._process = cp.spawn('java', [ '-jar', that.jar, '-debug' ], opt);
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

SeleniumServer.prototype.stop = function (cb) {
  var child = this._process;
  child.once('close', cb);
  child.kill('SIGINT');
};

module.exports = SeleniumServer;

