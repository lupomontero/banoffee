var path = require('path');
var async = require('async');
var Mocha = require('mocha');
var wd = require('wd');
var Server = require('./server');

function run(remote, platform, tests) {
  console.log([
    'Running tests on ', platform.browserName, ' ', platform.version,
    ' (', platform.platform, ')'
  ].join(''));

  var server = new Server();

  global.getBrowser = function (cb) {
    var browser = wd.remote(remote);
    return browser.init(platform, function () {
      cb(null, browser);
    });
  };

  async.series([
    function (cb) { server.start(cb); },
    function (cb) {
      var mocha = new Mocha({ reporter: 'spec', slow: 20000 });
      tests.forEach(function (test) {
        mocha.addFile(test);
      });
      mocha.run(function (failures) {
        cb();
      });
    },
    function (cb) { server.stop(cb); }
  ], function (err) {
    if (err) { console.error(err); }
    process.exit();
  });
}

process.on('message', function (m) {
  if (m.type === 'init') {
    run(m.remote, m.platform, m.tests);
  }
});

