var util = require('util'),
    _ = require('underscore'),
    gplus = require('./gplus'),
    keystone = require('keystone'),
    async = require('async'),
    debug = require('debug')('cadence:googleplus:page'),
    AbstractType = require('../abstract_type'),
    SOURCE_NAME = 'GooglePlus',
    DOC_SOURCE = 'googleplus',
    DOC_TYPE = 'page',
    DELTA_FIELDS = [ 'plusOneCount', 'circledByCount' ];

/**
 * GooglePlus Page
 * @class
 * @augments AbstractType
 */
function Page(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Page, AbstractType);

/**
 * Get a Page
 * @param {string} id
 * @param {esPageCallback} callback
 */
Page.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, makePageFromHit(res));
  });
}

function makePageFromHit(hit) {
  var result = new Page(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Pull Instgram Page
 * @param {User} user
 * @param {function} callback
 */
Page.pull = function(user, callback) {
  var requestOpts = gplus.requestOpts(user, 'channels', {
    part: 'contentDetails,snippet,statistics',
    id: user.services.google.youtubeChannelID,
  });

  debug("pulling page for user id %s", user.id);

  gplus.request(requestOpts, function(err, body) {
    if(err) return callback(err);

    if(body.items[0]) {

      if(body.items[0].contentDetails.relatedPlaylists.uploads && user.services.google.youtubeChannelUploadPlaylistID != body.items[0].contentDetails.relatedPlaylists.uploads) {

        user.services.google.youtubeChannelUploadPlaylistID = body.items[0].contentDetails.relatedPlaylists.uploads;
        user.save(function(err) {
          if (err) return callback(err);

          Page.process(user, body.items[0], callback);
        })


      } else {
        Page.process(user, body.items[0], callback);
      }
    } else {
      debug('Panic!');
      callback();
    }
  });

};

// alias
Page.pullAll = Page.pull;

/**
 * Adds appropriate data to Page from a raw googlePlusPage object.
 * @param {object} rawInstgramUser - A raw youtube user from a stream or rest API
 */
Page.prototype.populateFields = function(user, googlePlusPage) {
  _.extend(this, {
    user_id: user.services.google.profileId,
    user_name: user.services.google.username,
    cadence_user_id: user.id,

    timestamp: new Date()
  });
}

Page.process = function(user, googlePlusPage, callback) {
  Page.findOne(googlePlusPage.id, function(err, page) {
    if (err) return callback(err);

    if(page) {
      page.modifyByDelta(function(err) {
        if (err) return callback(err);

        var series = [];
        DELTA_FIELDS.forEach(function(fieldName) {
          if(googlePlusPage['statistics'][fieldName] != page[fieldName]) {
            page.createDelta(user, fieldName, googlePlusPage['statistics'][fieldName], function(err, res){
              debug('Delta created for %s', fieldName);
              return callback(err, res);
            });
          } else {
            return callback();
          }
        })
      });

    } else {
      var page = new Page(googlePlusPage.id);
      page.populateFields(user, googlePlusPage);
      page.create(function(err) {
        if (err) return callback(err);

        debug("created subscriber count %s", googlePlusPage.id);
        callback();
      });
    }
  });
}



/**
 * The object for building a link to the object (text and href)
 */
Page.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://youtube.com/' + opts.user.services.youtube.username
  };
};

/**
 * Creates the Page in Elasticsearch
 */
Page.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Creates a delta for the Page in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Page.prototype.createDelta = function(user, key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp,
    cadence_user_id: user.id,
    user_id: user.services.google.profileId
  };
  body[key] = value;

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the Page by the latest delta
 * @param {esPageCallback} callback
 */
Page.prototype.modifyByDelta = function(callback) {
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
}

module.exports = Page;
