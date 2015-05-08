var keystone = require('keystone');

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

Country.defaultColumns = 'code, name';
Country.register();
