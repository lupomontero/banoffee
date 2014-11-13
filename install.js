#! /usr/bin/env node

var vendor = require('./lib/vendor');

vendor.installAll(function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.log('OK');
    process.exit(0);
  }
});

