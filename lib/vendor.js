//
// Deps.
//
var os = require('os');
var fs = require('fs');
var path = require('path');
var url = require('url');
var https = require('https');
var tar = require('tar');
var zlib = require('zlib');
var unzip = require('unzip');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var async = require('async');
var checksum = require('checksum');
var executable = require('executable');
var ProgressBar = require('progress');


//
// Install vars.
//
var platform = os.platform();
var arch = os.arch();
var installPath = path.join(__dirname, '../vendor');


//
// Vendor dependencies.
//
exports.deps = [

  {
    name: 'selenium',
    fname: 'selenium-server-standalone-2.39.0.jar',
    executable: false,
    checksum: 'f2391600481dd285002d04b66916fc4286ff70ce',
    url: 'https://selenium.googlecode.com/files/selenium-server-standalone-2.39.0.jar'
  },

  {
    name: 'chromedriver',
    fname: 'chromedriver',
    executable: true,
    checksum: function () {
      if (platform === 'linux' && arch === 'x64') {
        return '832f6a852b6d476cd44f88dc55a0f4afe53aa388';
      } else if (platform === 'linux' && arch === 'x32') {
        return '03ec6fa226923094fee7fa8063b7af7cf6935b0f';
      } else if (platform === 'darwin') {
        return '5087d28743c01a0d0076be474c06ec21bfb6ef67';
      } else if (platform === 'win32') {
        // chromedriver.exe
        return '7aef9f114ef16e8cd6e95095193426c3afcd71a1';
      }
    },
    url: function () {
      var baseurl = 'https://chromedriver.storage.googleapis.com/2.12/';
      var fname = 'chromedriver_mac32.zip';
      if (platform === 'linux') {
        if (arch === 'x64') {
          fname = 'chromedriver_linux64.zip';
        } else {
          fname = 'chromedriver_linux32.zip';
        }
      }
      return baseurl + fname;
    },
    postInstall: function (cb) {
      fs.chmod(path.join(this.path, this.fname), 0755, cb);
    }
  },

  {
    name: 'sauce',
    fname: 'sc',
    executable: true,
    checksum: function () {
      if (platform === 'darwin') {
        return 'ffb103ee07e1253387f3bd1034e63a1cf03ee772';
      } else if (platform === 'linux') {
        return '82b4cf6956a146ff7d34b6beef2c319b445a8244';
      } else if (platform === 'win32') {
        // sc.exe
        return '6db64d236cc41197f61ab6dd7b6c92c08735afeb';
      }
    },
    url: function () {
      var baseurl = 'https://saucelabs.com/downloads/';
      var fname = 'sc-4.3.5-linux.tar.gz';
      if (platform === 'darwin') {
        fname = 'sc-4.3.5-osx.zip';
      } else if (platform === 'win32') {
        fname = 'sc-4.3.5-win32.zip';
      }
      return baseurl + fname;
    },
    postInstall: function (cb) {
      var dep = this;
      var suffix = 'linux';
      if (platform === 'darwin') {
        suffix = 'osx';
      } else if (platform === 'win32') {
        suffix = 'win32';
      }

      var tmp = dep.path + '.tmp';
      var subdir = 'sc-4.3.5-' + suffix;
      var bin = path.join(dep.path, dep.fname);

      async.series([
        async.apply(fs.rename, dep.path, tmp),
        async.apply(fs.mkdir, dep.path),
        async.apply(fs.rename, path.join(tmp, subdir, 'bin/sc'), bin),
        async.apply(rimraf, tmp)
      ], cb);
    }
  }

];


//
// Check to see whether a dependency is installed.
//
exports.isInstalled = function (dep, cb) {
  var file = path.join(dep.path, dep.fname);

  fs.exists(file, function (exists) {
    if (!exists) { return cb(false); }
    // verify checksum
    checksum.file(file, function (err, sum) {
      if (err) { return cb(err); }
      var expected = typeof dep.checksum === 'function' ? dep.checksum() : dep.checksum;
      if (expected !== sum) {
        console.log('File exists but checksum verification failed');
        return cb(false);
      }
      if (!dep.executable) { return cb(true); }
      executable(file, function (err, executable) {
        if (err) { return cb(err); }
        if (!executable) {
          console.log('File exists but it is not executable');
          return cb(false);
        }
        cb(true);
      });
    });
  });
};


//
// Download dependency.
//
function download(dep, cb) {
  var urlObj = url.parse(typeof dep.url === 'function' ? dep.url() : dep.url);
  var fname = urlObj.path.split('/').pop();
  var ext = fname.split('.').pop();

  console.log('Fetching ' + urlObj.href);

  var req = https.request({
    host: urlObj.host,
    port: 443,
    path: urlObj.path
  });

  req.on('response', function (res) {
    var len = parseInt(res.headers['content-length'], 10);
    var bar = new ProgressBar('Downloading [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len
    });
    // Update progress on data events...
    res.on('data', function (chunk) { bar.tick(chunk.length); });

    if (ext === 'zip') {
      res.pipe(unzip.Extract({ path: dep.path })).on('close', cb);
    } else if (ext === 'gz') {
      var activeEntries = 0;
      var parserEnded = false;
      res.pipe(zlib.Unzip()).pipe(tar.Parse()).on('entry', function (entry) {
        var fullpath = path.join(dep.path, entry.path);
        if (entry.type === 'Directory') {
          // Create directory synchronously so that we can pipe next entry
          // without having to wait until directory has been created.
          return mkdirp.sync(fullpath);
        }
        activeEntries++;
        entry.pipe(fs.createWriteStream(fullpath)).on('finish', function () {
          activeEntries--;
          if (parserEnded && !activeEntries) { cb(); }
        });
      }).on('end', function () {
        parserEnded = true;
      });
    } else {
      res.pipe(fs.createWriteStream(path.join(dep.path, fname))).on('close', cb);
    }
  });

  req.end();
}


//
// Installed vendor dependency.
//
exports.install = function (dep, cb) {
  dep.path = path.join(installPath, dep.name);

  function postInstall(cb) {
    if (typeof dep.postInstall !== 'function') { return cb(); }
    console.log('Running post install...');
    dep.postInstall.call(dep, cb);
  }

  function ensureExecutable(cb) {
    if (!dep.executable) { return cb(); }
    fs.chmod(path.join(dep.path, dep.fname), 0755, cb);
  }

  function verifyInstalled(cb) {
    console.log('Verifying installation...');
    exports.isInstalled(dep, function (installed) {
      if (!installed) {
        return cb(new Error('Install verification failed'));
      }
      cb();
    });
  }

  function doInstall() {
    async.series([
      async.apply(download, dep),
      postInstall,
      ensureExecutable,
      verifyInstalled
    ], cb);
  }

  mkdirp.sync(dep.path);
  exports.isInstalled(dep, function (installed) {
    if (installed) {
      console.log(dep.name + ' is already installed.');
      return cb();
    }
    console.log(dep.name + ' is NOT installed.');
    doInstall();
  });
};


//
// Install all vendor dependencies.
//
exports.installAll = function (cb) {
  mkdirp.sync(installPath);
  async.eachSeries(exports.deps, exports.install, cb);
};

