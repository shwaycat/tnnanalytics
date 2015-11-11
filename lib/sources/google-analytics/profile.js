var util = require("util"),
    _ = require('underscore'),
    google = require('./google'),
    GoogleAPIError = require('../../google-api-error'),
    async = require('async'),
    moment = require('moment'),
    keystone = require('keystone'),
    debug = require('debug')('cadence:google-analytics:profile'),
    AbstractType = require("../abstract_type"),
    mxm = require('../../mxm-utils.js'),
    SOURCE_NAME = 'Google Analytics',
    DOC_SOURCE = 'googleAnalytics',
    DOC_TYPE = 'profile',
    DELTA_BULK_CREATE_ACTION = {
      create: {
        _index: keystone.get('elasticsearch index'),
        _type: DOC_SOURCE + '_delta'
      }
    };

/**
 * Google Analytics Profile
 * @class
 * @augments AbstractType
 */
function Profile(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Profile, AbstractType);

/**
 * Get a Profile
 * @param {string} id
 * @param {esProfileCallback} callback
 */
Profile.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Profile(id, res._source));
  });
};

/**
 * Create a body for a profile delta bulk create
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @return {Object} bulk create body
 */
Profile.prototype.deltaBody = function(key, value, timestamp) {
  var body = {
        original_id: this.id,
        timestamp: timestamp
      };

  if (!body.timestamp) { // default timestamp
    body.timestamp = new Date();
  }

  if ('object' == typeof value) {
    _.extend(body, value);
  } else {
    body[key] = value;
  }

  return body;
};

/**
 * Creates a delta for the Profile in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Profile.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = null;
  }

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: this.deltaBody(key, value, timestamp)
  }, callback);
};

function getTrafficSource(row) {
  if (/yes/i.test(row[3])) {
    return 'Social';
  } else if (/referral/i.test(row[2])) {
    return 'Referral';
  } else if (/organic/i.test(row[2])) {
    return 'Org. Search';
  } else if (/\(none\)/i.test(row[2])) {
    return 'Direct';
  }
  return null;
}

function buildBulkCreateDelta(profile, row, data, key, index) {
  var timestamp = data.timestamp;
  data = _.omit(data, 'timestamp');
  data[key] = parseInt(row[index], 10);

  return profile.deltaBody(key, data, timestamp);
}

/**
 * Pull recent Google Analytics Profile data
 * @param {User} user
 * @param {function} callback
 */
Profile.pull = function(user, callback) {
  var profiles = user.services.google.analyticsProfiles;

  async.forEachOfSeries(profiles, function(profileID, profileName, nextProfile) {
    Profile.findOne(profileID, function(err, profile) {
      if (err) return nextProfile(err);
      if (!profile) return nextProfile(new Error("Profile does not exist"));

      var bulkUpdater = new mxm.ElasticsearchBulkManager(100, DELTA_BULK_CREATE_ACTION),
          requestOpts = google.requestOpts(user, 'data', 'ga', {
            ids: 'ga:'+profile.id,
            'start-date': 'yesterday',
            'end-date': 'today',
            dimensions: [ 'ga:dateHour', 'ga:countryIsoCode', 'ga:medium',
              'ga:hasSocialSourceReferral' ].join(','),
            metrics: [ 'ga:sessions', 'ga:bounces', 'ga:pageviews', 'ga:users',
              'ga:sessionDuration' ].join(',')
          });

      google.pager('nextLink', requestOpts, function(row, next) {
        var data = {
              timestamp: moment(row[0],'YYYYMMDDHH').toDate(),
              trafficSource: getTrafficSource(row),
              country: row[1]
            };

        keystone.elasticsearch.deleteByQuery({
          index: keystone.get('elasticsearch index'),
          type: DOC_SOURCE + '_delta',
          body: {
            "query": {
              "filtered": {
                "filter": {
                  "and": [
                    {
                      "term": { "timestamp": data.timestamp }
                    },
                    {
                      "term": { "trafficSource": data.trafficSource }
                    },
                    {
                      "term": { "country": data.country }
                    }
                  ]
                }
              }
            }
          }
        }, function(err) {
          if (err) return next(err);

          bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'sessions', 4));
          bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'bounces', 5));
          bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'pageViews', 6));
          bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'users', 7));
          bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'sessionDuration', 8));

          bulkUpdater.flushIfFull(next);
        });
      }, function(err) {
        if (err) return nextProfile(err);
        bulkUpdater.flush(nextProfile);
      });
    });
  }, callback);
};

/**
 * Pull all available data for the Google Analytics Profiles
 * @param {User} user
 * @param {function} callback
 */
Profile.pullAll = function(user, callback) {
  var profiles = user.services.google.analyticsProfiles;

  async.forEachOfSeries(profiles, function(profileID, profileName, nextProfile) {
    var profile = new Profile(profileID, {
          timestamp: new Date(),
          cadence_user_id: user.id,
          doc_text: profileName
        });

    debug("pulling all profile data for user id %s, profile %s", user.id, profileID);

    profile.create(function(err) {
      if (err) return nextProfile(err);

      debug("profile created: %j", profile);

      var midMonthDate = moment().date(15);

      async.whilst(function() { return midMonthDate !== null; },
        function(done) {
          var gotSome = false,
              bulkUpdater = new mxm.ElasticsearchBulkManager(500, DELTA_BULK_CREATE_ACTION),
              requestOpts = google.requestOpts(user, 'data', 'ga', {
                ids: 'ga:'+profile.id,
                'start-date': midMonthDate.clone().startOf('month').format('YYYY-MM-DD'),
                'end-date': midMonthDate.clone().endOf('month').format('YYYY-MM-DD'),
                dimensions: [ 'ga:dateHour', 'ga:countryIsoCode', 'ga:medium',
                  'ga:hasSocialSourceReferral' ].join(','),
                metrics: [ 'ga:sessions', 'ga:bounces', 'ga:pageviews', 'ga:users',
                  'ga:sessionDuration' ].join(',')
              });

          google.pager('nextLink', requestOpts, function(row, next) {
            gotSome = true;

            var data = {
                  timestamp: moment(row[0],'YYYYMMDDHH').toDate(),
                  trafficSource: getTrafficSource(row),
                  country: row[1]
                };

            bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'sessions', 4));
            bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'bounces', 5));
            bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'pageViews', 6));
            bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'users', 7));
            bulkUpdater.addSource(buildBulkCreateDelta(profile, row, data, 'sessionDuration', 8));

            bulkUpdater.flushIfFull(next);
          }, function(err) {
            if (err) return done(err);
            if (gotSome) {
              midMonthDate.subtract(1, 'month');
            } else {
              midMonthDate = null;
            }

            bulkUpdater.flush(done);
          });
        },
        nextProfile
      );
    });
  }, callback);
};

/**
 * Creates the Profile in Elasticsearch
 * @param {esCreateCallback} callback
 */
Profile.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Update the Profile in Elasticsearch
 * @param {function} callback
 */
Profile.prototype.update = function(callback) {
  keystone.elasticsearch.index({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

module.exports = Profile;
