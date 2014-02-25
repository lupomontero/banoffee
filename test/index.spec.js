var banoffee = require('../');

exports['module is a function'] = function (t) {
  t.equal(typeof banoffee, 'function');
  t.done();
};

exports['banoffee() returns an instance of Banoffee runner'] = function (t) {
  var runner = banoffee({});
  t.equal(runner.constructor.name, 'Banoffee');
  t.done();
};

exports.foo = function (t) {
  var runner = banoffee();
  //console.log(runner.run());
  t.done();
};

