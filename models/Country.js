var keystone = require('keystone'),
    _ = require('underscore');

/**
 * Country
 * @typedef {Object} Country
 * @member {String} code - human name
 * @member {String} name - email address
 */

var Country = new keystone.List('Country');

Country.add({
  code: { type: String, required: true, initial: false },
  name: { type: String, required: true, initial: false }
});

Country.schema.statics.findByPoint = function(point, callback) {
  this.findOne({
    bbox: {
     "$near": {
       "$geometry": {
         type: "Point",
         coordinates: [ point.lon, point.lat ]
       }
     }
   }
 }, callback);
};

Country.schema.statics.getMap = function(callback) {
  this.find({}, function(err, results) {
    if(err) callback(err);
    if(results) {
      callback(null, 
        _.reduce(results, function(memo, country) {
          memo[country.code] = country.name;
          return memo;
        },{})
      );

    } else {
      callback(null);
    }
  });
}

Country.defaultColumns = 'code, name';
Country.register();
