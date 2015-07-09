var util = require('util'),
    async = require('async'),
    _ = require('underscore'),
    fb = require('./fb'),
    keystone = require('keystone'),
    debug = require('debug')('cadence:facebook:status'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'Facebook',
    DOC_SOURCE = 'facebook',
    DOC_TYPE = 'status',
    DELTA_FIELDS = [ 'likes' ];

/**
 * Facebook Status
 * @class
 * @augments AbstractType
 */
function Status(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Status, AbstractType);

/**
 * Get a Status
 * @param {string} id
 * @param {esStatusCallback} callback
 */
Status.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Status(id, res._source));
  });
};

function makeStatusFromHit(hit) {
  var result = new Status(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Status
 * @param {User} user
 * @param {esStatusCallback} callback
 */
Status.findLatest = function(user, callback) {
  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": [
              {
                "term": { "doc_type": DOC_TYPE }
              },
              {
                "term": { "cadence_user_id": user.id }
              }
            ]
          }
        }
      },
      "size": 1,
      "sort": [
        { "timestamp": "desc" }
      ]
    }
  }, function(err, res) {
    if (err) return callback(err);
    if (res.hits.hits.length != 1) return callback(null, null);

    callback(null, makeStatusFromHit(res.hits.hits[0]));
  });
};

/**
 * Get all the Status IDs and iterate over each one
 * @param {User} user
 * @param {function} iterator - fn(statuses, nextCallback)
 * @param {function} callback - fn(err)
 */
Status.eachBatch = function(user, iterator, callback) {
  var fromIndex = 0;

  async.doWhilst(
    function(next) {
      keystone.elasticsearch.search({
        index: keystone.get('elasticsearch index'),
        type: DOC_SOURCE,
        body: {
          "query": {
            "filtered": {
              "filter": {
                "and": [
                  {
                    "term": { "doc_type": DOC_TYPE }
                  },
                  {
                    "term": { "cadence_user_id": user.id }
                  }
                ]
              }
            }
          },
          "size": 100,
          "from": fromIndex
        }
      }, function(err, res) {
        if (err) return next(err);

        if (fromIndex + res.hits.hits.length >= res.hits.total) {
          fromIndex = false;
        } else {
          fromIndex += res.hits.hits.length;
        }

        iterator(_.map(res.hits.hits, makeStatusFromHit), next);
      });
    },
    function() {
      return fromIndex;
    },
    callback
  );
};

/**
 * Creates a delta for the Status in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Status.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
        original_id: this.id,
        timestamp: timestamp,
        cadence_user_id: this.cadence_user_id
      };
  body[key] = value;
  body['doc_source'] = DOC_SOURCE;
    
  debug("create status delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
};

/**
 * Pull Facebook Statuses
 * @param {User} user
 * @param {function} callback
 */
Status.pull = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts;

  debug("pulling new statuses for user id %s, page %s", user.id, pageID);

  Status.findLatest(user, function(err, latestStatus) {
    if (err) return callback(err);

    var opts = { fields: 'message,likes.summary(true).limit(0)' };

    if (latestStatus) {
      opts.since = Math.floor(latestStatus.timestamp.getTime()/1000);
    }

    requestOpts = fb.requestOpts(user, pageID, 'statuses', opts);

    fb.pager('next', requestOpts, function(obj, next) {
      if (!obj) return next('stop');

      var status = new Status(obj.id, {
            timestamp: new Date(obj.updated_time),
            cadence_user_id: user.id,
            doc_text: obj.message,
            doc_source: DOC_SOURCE,
            likes: 0
          });

      if (obj.likes && obj.likes.summary) {
        status.likes = obj.likes.summary.total_count;
      }

      status.create(function(err, res, status) {
        if (err && status == 409) return next(null, null);
        if (err) return next(err);

        debug("created status %s", status.id);
        next();
      });
    }, callback);
  });
};

/**
 * Pull all available Facebook Statuses
 * @param {User} user
 * @param {function} callback
 */
Status.pullAll = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      requestOpts = fb.requestOpts(user, pageID, 'statuses', {
        fields: 'message,likes.summary(true).limit(0)'
      });

  debug("pulling all statuses for user id %s, page %s", user.id, user.services.facebook.pageID);

  fb.pager('next', requestOpts, function(obj, next) {
    if (!obj) return next('stop');

    var status = new Status(obj.id, {
          timestamp: new Date(obj.updated_time),
          cadence_user_id: user.id,
          doc_text: obj.message,
          likes: 0,
          shares: 0
        });

    if (obj.likes && obj.likes.summary) {
      status.likes = obj.likes.summary.total_count;
    }

    if (obj.shares) {
      status.shares = obj.shares.count;
    }

    status.create(function(err, res, statusCode) {
      if (err && statusCode == 409) return next(null, null);
      if (err) return next(err);

      debug("created status %s", status.id);
      next();
    });
  }, function(err) {
    if (err) console.error(err);
    callback(err);
  });
};

/**
 * The object for building a link to the object (text and href)
 * @returns {Object} object with text and href
 */
Status.prototype.emailLinkObject = function() {
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/' + this.id
  };
};

/**
 * Creates the Status in Elasticsearch
 * @param {esCreateCallback} callback
 */
Status.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Modify the Status by the latest delta
 * @param {esStatusCallback} callback
 */
Status.prototype.modifyByDelta = function(callback) {
  var self = this;

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: {
      query: {
        filtered: {
          filter: {
            term: { original_id: this.id }
          }
        }
      },
      aggregations: {
        deltas: {
          filters: {
            filters: _.map(DELTA_FIELDS, function(fieldName) {
              return { exists: { field: fieldName } };
            })
          },
          aggregations: {
            last_delta: {
              top_hits: {
                sort: [
                  { _timestamp: { order: 'desc' } }
                ],
                size: 1
              }
            }
          }
        }
      }
    }
  }, function(err, res) {
    if (err) return callback(err);

    DELTA_FIELDS.forEach(function(fieldName, i) {
      var delta = res.aggregations.deltas.buckets[i].last_delta.hits.hits[0];
      if(delta) {
        self[fieldName] = delta._source[fieldName];
      }
    });

    callback(null, self);
  });
};

module.exports = Status;
