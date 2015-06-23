var util = require('util'),
    _ = require('underscore'),
    yt = require('./yt'),
    keystone = require('keystone'),
    async = require('async'),
    moment = require('moment'),
    GoogleAPIError = require('../../google-api-error'),
    debug = require('debug')('cadence:youtube:channel'),
    AbstractType = require('../abstract_type'),
    mxm = require('../../mxm-utils.js'),
    SOURCE_NAME = 'YouTube',
    DOC_SOURCE = 'youtube',
    DOC_TYPE = 'channel',
    DELTA_FIELDS = [ 'subscriberCount' ],
    DELTA_BULK_CREATE_ACTION = {
      create: {
        _index: keystone.get('elasticsearch index'),
        _type: DOC_SOURCE + '_delta'
      }
    };

/**
 * YouTube Channel
 * @class
 * @augments AbstractType
 */
function Channel(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Channel, AbstractType);

function makeChannelFromHit(hit) {
  var result = new Channel(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get a Channel
 * @param {string} id
 * @param {esChannelCallback} callback
 */
Channel.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, makeChannelFromHit(res));
  });
};

/**
 * Create a body for a Channel delta bulk create
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @return {Object} bulk create body
 */
Channel.prototype.deltaBody = function(key, value, timestamp) {
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
 * Pull Channel
 * @param {User} user
 * @param {function} callback
 */
Channel.pull = function(user, callback) {
  debug("pulling channel for user id %s", user.id);

  Channel.findOne(user.services.googleplus.youtubeChannelID, function(err, channel) {
    if (err) return callback(err);

    channel.modifyByDelta(function(err, channel) {
      if (err) return callback(err);

      var requestOpts = yt.requestOpts(user, 'channels', {
            part: 'statistics',
            id: channel.id
          });

      yt.request(requestOpts, function(err, body) {
        if (err || body.error) return callback(err || new GoogleAPIError(body));

        var value = body.items[0].statistics.subscriberCount;

        channel.createDelta(user, 'subscriberCount', value, callback);
      });
    });
  });
};

/**
 * Pull all available data for the YouTube Channel
 * @param {User} user
 * @param {function} callback
 */
Channel.pullAll = function(user, callback) {
  var requestOpts = yt.requestOpts(user, 'channels', {
        part: 'snippet,statistics',
        id: user.services.googleplus.youtubeChannelID,
        fields: 'items(snippet(title,publishedAt),statistics)'
      });

  debug("pulling channel for user id %s", user.id);

  var channel = new Channel(user.services.googleplus.youtubeChannelID, {
        cadence_user_id: user.id,
        subscriberCount: 0
      });

  yt.request(requestOpts, function(err, body) {
    if (err || body.error) return callback(err || new GoogleAPIError(body));

    var item = body.items[0];

    channel.doc_text = item.snippet.title;
    channel.timestamp = new Date(item.snippet.publishedAt);

    var startDate = moment(channel.timestamp).clone().date(1),
        subscriberCount = 0;

    channel.create(function(err) {
      if (err) return callback(err);

      debug('channel created %j', channel);

      async.whilst(
        function() { return startDate.isBefore(moment()); },
        function(nextMonth) {
          var bulkUpdater = new mxm.ElasticsearchBulkManager(500),
              requestOpts = yt.analyticsRequestOpts(user, 'reports', {
                ids: 'channel=='+channel.id,
                'start-date': startDate.clone().startOf('month').format('YYYY-MM-DD'),
                'end-date': startDate.clone().endOf('month').format('YYYY-MM-DD'),
                metrics: [ 'subscribersLost', 'subscribersGained' ].join(','),
                dimensions: 'day',
                sort: 'day'
              });

          yt.request(requestOpts, function(err, body) {
            if (err || body.error) return nextMonth(err || new GoogleAPIError(body));

            _.each(body.rows, function(row) {
              var timestamp = moment(row[0],'YYYYMMDDHH').toDate();

              if (Math.abs(row[2] - row[1]) > 0) {
                subscriberCount = subscriberCount - row[1] + row[2];

                bulkUpdater.add(DELTA_BULK_CREATE_ACTION,
                  channel.deltaBody('subscriberCount', subscriberCount, timestamp));
              }
            });

            bulkUpdater.flush(function(err) {
              if (err) return nextMonth(err);
              startDate.add(1, 'month');
              nextMonth();
            });
          });
        },
        function(err) {
          if (err) return callback(err);
          var value = parseInt(item.statistics.subscriberCount, 10);
          channel.createDelta(user, 'subscriberCount', value, callback);
        }
      );
    });
  });
};

/**
 * The object for building a link to the object (text and href)
 */
Channel.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://youtube.com/' + opts.user.services.googleplus.username
  };
};

/**
 * Creates the Channel in Elasticsearch
 */
Channel.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Creates a delta for the Channel in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Channel.prototype.createDelta = function(user, key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp,
    cadence_user_id: user.id,
    user_id: user.services.googleplus.profileId
  };
  body[key] = value;
  body['doc_source'] = DOC_SOURCE;

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
};

/**
 * Modify the Channel by the latest delta
 * @param {esChannelCallback} callback
 */
Channel.prototype.modifyByDelta = function(callback) {
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

module.exports = Channel;
