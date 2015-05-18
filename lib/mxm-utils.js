var _ = require('underscore');

exports.objTry = function() {
  var args = Array.prototype.slice.call(arguments);

  var obj = args.shift();

  if(_.isArray(_.first(args))) {
    args = _.first(args);
  }

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