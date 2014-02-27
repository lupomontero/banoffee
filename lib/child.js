var path = require('path');
var async = require('async');
var wd = require('wd');

var Mocha = require('mocha');
require("mocha-as-promised")();

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// These are set by the grunt-crank task before running the tests so we know
// where to find hoodie servers.
global.ports = {
  www: parseInt(process.env.HOODIE_WWW_PORT, 10),
  admin: parseInt(process.env.HOODIE_ADMIN_PORT, 10),
  couch: parseInt(process.env.HOODIE_COUCH_PORT, 10)
};

function run(remote, platform, tests) {
  console.log([
    'Running tests on ', platform.browserName, ' ', platform.version,
    ' (', platform.platform, ')'
  ].join(''));

  var mocha = new Mocha({ reporter: 'spec', slow: 20000 });
  var browser = global.browser = wd.remote(remote, 'promiseChain');

  tests.forEach(function (test) { mocha.addFile(test); });

  browser.init(platform).then(function () {
    mocha.run(function (failures) {
      browser.quit().then(function () {
        process.exit();
      });
    });
  });

}

process.on('message', function (m) {
  if (m.type === 'init') {
    run(m.remote, m.platform, m.tests);
  }
});

