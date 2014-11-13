var path = require('path');
var cp = require('child_process');
var _ = require('lodash');


var defaults = {
  vendorDir: path.join(__dirname, 'vendor')
};


function SauceServer(opt) {
  this.options = _.extend({}, defaults, opt);
  this.bin = path.join(this.options.vendorDir, 'sauce/sc');
}

/*
--readyfile $READY_FILE \
--tunnel-identifier $TRAVIS_JOB_NUMBER \
*/
SauceServer.prototype.start = function (cb) {
  var that = this;
  var remote = that.options.remote || {};
  var logfile = path.join(that.options.logDir, 'sauce.log');
  var args = [ '-u', remote.user, '-k', remote.pwd, '--logfile', logfile ];
  var started = false;
  var sc = this._process = cp.spawn(that.bin, args);
  sc.stdout.on('data', function (chunk) {
    console.log(chunk.toString());
    if (started) { return; }
    if (/Sauce Connect is up, you may start your tests\./i.test(chunk)) {
      started = true;
      cb();
    }
  });
};

SauceServer.prototype.stop = function (cb) {
  var child = this._process;
  child.once('close', cb);
  child.kill('SIGINT');
};

module.exports = SauceServer;

