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

exports.roundToHour = function(date) {

    date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
    date.setMinutes(0);
    date.setSeconds(60);

    return date;
}