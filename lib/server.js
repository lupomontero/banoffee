var spawn = require('child_process').spawn;
var async = require('async');

// TODO: This function should be replaced with `child_process.exec()`.
function exec(cmd, args, opt, cb) {
  if (arguments.length < 2) {
    throw new Error('At least two arguments.');
  } else if (arguments.length === 2) {
    cb = args;
    args = [];
    opt = {};
  } else if (arguments.length === 3) {
    cb = opt;
    opt = {};
  }
  var ps = spawn(cmd, args, opt);
  var stderr = '';
  var stdout = '';
  ps.stderr.on('data', function (chunk) { stderr += chunk; });
  ps.stdout.on('data', function (chunk) { stdout += chunk; });
  ps.on('close', function () {
    if (stderr) { return cb(new Error(stderr)); }
    cb(null, stdout);
  });
}

function isRunning(pid, cb) {
  exec('ps', [ '-o', 'pid' ], function (err, stdout) {
    if (err) { return cb(err); }
    var lines = stdout.split('\n').filter(function (line) {
      var linePid = line.trim();
      if (!/^\d+$/.test(linePid)) {
        return false;
      }
      return pid === parseInt(linePid, 10);
    });
    cb(lines.length > 0);
  });
}

function getChildren(pid, cb) {
  exec('ps', [ '-o', 'ppid,pid' ], function (err, stdout) {
    if (err) { return cb(err); }
    var children = stdout.split('\n')
      .map(function (line) {
        var matches = /^(\d+)\s+(\d+)$/.exec(line.trim());
        if (!matches || matches.length < 2) { return; }
        return {
          ppid: parseInt(matches[1], 10),
          pid: parseInt(matches[2], 10)
        };
      })
      .filter(function (p) {
        return p && p.ppid === pid;
      });
    cb(null, children);
  });
}

function killIndividual(pid, cb) {
  function waitAndCheck() {
    //console.log('Waiting for process to die...');
    setTimeout(function () {
      isRunning(pid, function (isRunning) {
        if (!isRunning) {
          //console.log('Killed process ' + pid);
          return cb();
        }
        // Process hasn't died yet, check again...
        //console.log('Process is still running.');
        waitAndCheck();
      });
    }, 1000);
  }
  //console.log('Killing process ' + pid + '...');
  exec('kill', [ pid ], function (err, stdout) {
    // We ignore errors. If the process has already been killed we get an error
    // and that can be ignored. So we rely on checking whether the process was
    // actually killed after waiting for a bit.
    waitAndCheck();
  });
}

// Recursively kill a process' children, grandchildren and so on before killing
// the parent process itself.
function killFamily(pid, cb) {
  //console.log('Killing family of process ' + pid + '...');
  getChildren(pid, function (err, children) {
    if (err) { return cb(err); }
    if (!children.length) {
      //console.log('Process ' + pid + ' does not have any children.');
      return killIndividual(pid, cb);
    }
    //console.log('Process ' + pid + ' has ' + children.length + ' children.');
    async.eachSeries(children, function (child, cb) {
      killFamily(child.pid, cb);
    }, function (err) {
      if (err) { return cb(err); }
      killIndividual(pid, cb);
    });
  });
}

function Server(opt) {
  this.options = opt || {};
  this._process = null;
}

Server.prototype.start = function (cb) {
  var server = this;
  var args = [ 'start' ];
  var options = {};
  var logPrefix = 'server: ';

  var child = this._process = spawn('npm', args, options);

  child.stderr.on('data', function (data) {
    process.stderr.write(logPrefix + data);
  });

  child.stdout.on('data', function (data) {
    //process.stdout.write(logPrefix + data);
    if (/All plugins started/.test(data)) {
      //console.log('Server running with pid ' + child.pid);
      cb();
    }
  });

  // Stop server when parent exits.
  ['exit', 'SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT'].forEach(function (s) {
    process.on(s, function () {
      //console.log('parent process has exited');
    });
  });
};

Server.prototype.stop = function (cb) {
  cb = cb || function () {};
  var child = this._process;
  if (child && !child.killed) {
    killFamily(child.pid, cb);
  } else {
    cb();
  }
};

module.exports = Server;

