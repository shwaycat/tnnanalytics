var util = require("util"),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:instagram:media'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Instagram',
    DOC_SOURCE = 'instagram',
    DOC_TYPE = 'media',
    keystone = require('keystone'),
    insta = require('./insta'),
    mxm = require('../../mxm-utils.js'),
    Comment = require('./comment'),
    DELTA_FIELDS = [ 
      {'likes': 'likes.count'}, //esKey: instaKey
      {'comments': 'comments.count'} //esKey: instaKey
    ];

/**
 * Instagram Media
 * @class
 * @augments AbstractType
 */
function Media(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Media, AbstractType);

/**
 * Get a Media
 * @param {string} id
 * @param {esMediaCallback} callback
 */
Media.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Media(id, res._source));

  });
}

function makeMediaFromHit(hit) {
  var result = new Media(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Media
 * @param {User} user
 * @param {esMediaCallback} callback
 */
Media.findLatest = function(user, callback) {
  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    body: {
      "query": {
        "filtered": {
          "filter": {
            "and": [
              {
                "term": {
                  "doc_type": DOC_TYPE
                }
              },
              {
                "term": {
                  "cadence_user_id": user.id
                }
              }
            ]
          }
        }
      },
      "size": 1,
      "sort": [
        {
          "_timestamp": "desc"
        }
      ]
    }
  }, function(err, res) {
    if (err) return callback(err);
    if (res.hits.hits.length != 1) return callback(null, null);

    callback(null, makeMediaFromHit(res.hits.hits[0]));
  });
};

/**
 * Pull Instagram Medias
 * @param {User} user - Keystone user to pull from Instagram for
 * @param {esMediaPullCallback} callback
 */
Media.pull = function(user, callback) {
  debug("pulling media for user id %s", user.id);
  var requestOpts;

  Media.findLatest(user, function(err, latestMedia) {
    if (err) return callback(err);

    var opts = {
      count: 50
    };

    if (latestMedia) {
      opts.min_id = latestMedia.id;
    }

    requestOpts = insta.requestOpts(user, 'users/self/media/recent', opts);

    insta.pager('next', requestOpts, function(obj, next) {
      if (!obj) return next('stop');

      Media.process(user, obj, function() {
        Media.processComments(user, obj, next);
      });

    }, callback);


  });

}

/**
 * Pull ALL Instagram Media
 * @param {User} user - Keystone user to pull from Instagram for
 * @param {esMediaPullCallback} callback
 */
Media.pullAll = function(user, callback) {
  debug("pulling ALL media for user id %s", user.id);

  var opts = {
    count: 50
  };

  requestOpts = insta.requestOpts(user, 'users/self/media/recent', opts);

  insta.pager('next', requestOpts, function(obj, next) {
    if (!obj) return next('stop');

    Media.process(user, obj, function(err) {
      if(err) return next(err);
      Media.processComments(user, obj, next);
    });

  }, callback);

}

/**
 * The object for building a link to the object (text and href)
 */
Media.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: this.url
  };
}

/**
 * Processes a Media and saves it or creates a delta if applicable.
 * @param {user} user - Keystone user with twitter to link to direct-messages
 * @param {media} - A raw Media (media object)
 * @param {callback} - Callback for after processing is complete
 */
Media.process = function(user, media, callback) {
  Media.findOne(media.id, function(err, esMedia) {
    if(err) return callback(err);

    if(esMedia) {

      esMedia.modifyByDelta(function(err){
        if (err) return callback(err);

        async.eachSeries(DELTA_FIELDS, function(fieldMap, nextField) {
          var esKey = _.chain(fieldMap)
                       .keys()
                       .first()
                       .value();
          var instaKey = _.chain(fieldMap)
                          .values()
                          .first()
                          .value();

          var instaValue = mxm.objTry(media, instaKey.split('.'));

          if(!instaValue) {
            instaValue = 0;
          }

          if(esMedia[esKey] != instaValue) {
            esMedia.createDelta(user, esKey, instaValue, nextField);
          } else {
            nextField();
          }
        }, callback);
      });

    } else {
      var newMedia = new Media(media.id);
      newMedia.populateFields(user, media);
      newMedia.create(function(err, res, status) {
        if (err) return callback(err);

        debug("created media %s", newMedia.id);
        callback();
      });
    }
  });
}

Media.processComments = function(user, media, callback) {

  if(media.comments && media.comments.count) {
    debug("%s comments for media %s. Media has %s", media.comments.count, media.id, media.comments.data.length);

    if(media.comments.count > media.comments.data.length) {
      Comment.pull(user, media, callback);
    } else {
      debug("Grab what you got");
      async.eachLimit(media.comments.data, 5, function(comment, next) {
        Comment.process(user, media, comment, next);
      }, callback);
    }


  } else {
    callback();
  }
};

/**
 * Creates the Media in Elasticsearch
 */
Media.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
}

/**
 * Adds appropriate data to Media from a raw Media object.
 * @param {object} rawMedia - A raw tweet from a stream or rest API
 */
Media.prototype.populateFields = function(user, rawMedia) {
    console.log(rawMedia.id);
  _.extend(this, {
    doc_text: rawMedia.caption ? rawMedia.caption.text : null,
    user_id: rawMedia.user.id,
    user_name: rawMedia.user.username,
    cadence_user_id: user.id,
    url: rawMedia.link,
    likes: rawMedia.likes.count,
    comments: rawMedia.comments.count,
    timestamp: new Date(rawMedia.created_time * 1000)
  });
}

/**
 * Creates a delta for the Media in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Media.prototype.createDelta = function(user, key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
    original_id: this.id,
    timestamp: timestamp,
    cadence_user_id: user.id,
    user_id: user.services.instagram.profileId
  };
  body[key] = value;
  body['doc_source'] = DOC_SOURCE;

  debug("create Media delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
}

/**
 * Modify the Media by the latest delta
 * @param {esMediaCallback} callback
 */
Media.prototype.modifyByDelta = function(callback) {
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
              return { exists: { field: _.chain(fieldName).keys().first() } };
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

module.exports = Media;
