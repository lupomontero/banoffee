var path = require('path');
var assert = require('assert');
var banoffee = require('../');

describe.only('banoffee', function () {

  this.timeout(60 * 1000);

  it('should be a function', function (done) {
    assert.equal(typeof banoffee, 'function');
    done();
  });

  it('should throw when baseDir doesnt exist', function (done) {
    banoffee({ baseDir: '/foo-bar-baz' }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/baseDir doesn't exist/i.test(err.message));
      done();
    });
  });

  it('should throw when baseDir is not a directory', function (done) {
    banoffee({ baseDir: __filename }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/baseDir is not a directory/i.test(err.message));
      done();
    });
  });

  it('should throw when testDir doesnt exist', function (done) {
    banoffee({
      baseDir: __dirname,
      testDir: 'fooo',
    }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/testDir doesn't exist/i.test(err.message));
      done();
    });
  });

  it('should throw when testDir is not a directory', function (done) {
    banoffee({
      baseDir: __dirname,
      testDir: __filename,
    }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/testDir is not a directory/i.test(err.message));
      done();
    });
  });

  it('should throw when no tests found', function (done) {
    var repodir = path.resolve(__dirname, '../');
    banoffee({
      baseDir: repodir,
      testDir: path.join(repodir, 'bin')
    }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/no test files loaded/i.test(err.message));
      done();
    });
  });

  it('should throw when no test files match file pattern', function (done) {
    banoffee({
      baseDir: __dirname,
      testDir: 'fixtures'
    }).on('error', function (err) {
      assert.ok(err instanceof Error);
      assert.ok(/no test files loaded/i.test(err.message));
      done();
    });
  });

  it('should ...', function (done) {
    banoffee({
      baseDir: __dirname,
      testDir: 'fixtures',
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
