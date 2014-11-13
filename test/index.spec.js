var path = require('path');
var assert = require('assert');
var banoffee = require('../');

describe.only('banoffee', function () {

  this.timeout(60 * 1000);

  it('should be a function', function (done) {
    assert.equal(typeof banoffee, 'function');
    done();
  });

  it('should throw when testDir doesnt exist', function (done) {
    banoffee({ testDir: '/foo-bar-baz' }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/testDir doesn't exist/i.test(err.message));
      done();
    });
  });

  it('should throw when testDir is not a directory', function (done) {
    banoffee({ testDir: __filename }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/testDir is not a directory/i.test(err.message));
      done();
    });
  });

  it('should throw when no tests found', function (done) {
    banoffee({
      testDir: path.join(__dirname, '../bin')
    }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/no test files loaded/i.test(err.message));
      done();
    });
  });

  it('should throw when no test files match file pattern', function (done) {
    banoffee({
      testDir: path.join(__dirname, 'fixtures')
    }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/no test files loaded/i.test(err.message));
      done();
    });
  });

  it('should ...', function (done) {
    banoffee({
      testDir: path.join(__dirname, 'fixtures'),
      testFilePattern: 'test-*.js',
      platforms: [ { browserName: 'phantomjs' } ]
    }).on('log', function (str) {
      console.log('LOG:', str);
    }).on('end', function (failures) {
      console.log('banoffee ended!', failures);
      done();
    });
  });

});
