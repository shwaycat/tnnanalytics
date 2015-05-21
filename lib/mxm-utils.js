var _ = require('underscore');

exports.objTry = function() {
  var args = Array.prototype.slice.call(arguments);

  var obj = args.shift();

  for(x in args) {
    arg = args[x];

    if(obj && obj[arg]) {
      obj = obj[arg];
    } else {
      obj = undefined;
    }
  }

  return obj;
}