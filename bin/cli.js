#!/usr/bin/env node

var path = require('path');
var minimist = require('minimist');
var pkg = require("../package.json");
var banoffee = require('../');
var argv = minimist(process.argv.slice(2));

if (argv.v || argv.version) {
  console.log(pkg.version);
  process.exit(0);
}

if (argv.h || argv.help) {
  console.log([
    '',
    'Usage:',
    '',
    pkg.name + ' [ options ]',
    '',
    'Options:',
    '',
    '-c, --conf     Path to config file. Defaults to ./banoffee.conf.js',
    '-v, --version  Print the ' + require('../package.json').name + ' version.',
    '-h, --help     Print this help.',
    ''
  ].join('\n'));
  process.exit(0);
}

var confFile = argv.c || argv.conf || './banoffee.conf.js';
var conf = require(path.resolve(process.cwd(), confFile));

conf.baseDir = path.dirname(confFile);

// Run banoffee with loaded configuration...
banoffee(conf).on('error', function (err) {
  console.error('ERRORED: Error occurred while running tests');
  console.error(err);
  process.exit(1);
}).on('log', function (str) {
  console.log(str);
}).on('end', function (failures) {
  if (failures) {
    console.warn('FAILED: ' + failures + ' test(s) failed');
    process.exit(2);
  } else {
    console.log('PASSED: All tests passed');
  }
});

