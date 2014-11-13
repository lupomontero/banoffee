//
// Deps
//

var wd = require('wd');
var Mocha = require('mocha');
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

// Enable chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;


//
// Run tests when we receive init message
//
process.on('message', function (m) {
  if (m.type !== 'init') { return; }

  var mocha = new Mocha({ reporter: 'spec', slow: 20000 });
  var browser = global.browser = wd.remote(m.remote, 'promiseChain');

  m.files.forEach(function (file) { mocha.addFile(file); });

  browser.init(m.platform).then(function () {
    mocha.run(function (failures) {
      browser.quit().then(function () {
        process.exit(failures);
      });
    });
  });
});

