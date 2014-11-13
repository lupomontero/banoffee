//
// Deps
//

var path = require('path');
var async = require('async');
var wd = require('wd');

var Mocha = require('mocha');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;


function run(remote, platform, tests) {
  var mocha = new Mocha({ reporter: 'spec', slow: 20000 });
  var browser = global.browser = wd.remote(remote, 'promiseChain');

  tests.forEach(function (test) { mocha.addFile(test); });

  browser.init(platform).then(function () {
    mocha.run(function (failures) {
      browser.quit().then(function () {
        process.exit(failures);
      });
    });
  });
}


process.on('message', function (m) {
  if (m.type === 'init') {
    run(m.remote, m.platform, m.tests);
  }
});

