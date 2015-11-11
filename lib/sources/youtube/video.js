var util = require("util"),
    _ = require('underscore'),
    async = require('async'),
    moment = require('moment'),
    debug = require('debug')('cadence:youtube:video'),
    AbstractType = require("../abstract_type"),
    keystone = require('keystone'),
    yt = require('./yt'),
    mxm = require('../../mxm-utils.js'),
    GoogleAPIError = require('../../google-api-error'),
    SOURCE_NAME = 'YouTube',
    DOC_SOURCE = 'youtube',
    DOC_TYPE = 'video',
    DELTA_FIELDS = [ 'viewCount', 'likeCount', 'dislikeCount', 'shareCount', 'commentCount' ],
    DELTA_BULK_CREATE_ACTION = {
      create: {
        _index: keystone.get('elasticsearch index'),
        _type: DOC_SOURCE + '_delta'
      }
    };

/**
 * YouTube Video
 * @class
 * @augments AbstractType
 */
function Video(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Video, AbstractType);

/**
 * Get a Video
 * @param {string} id
 * @param {esVideoCallback} callback
 */
Video.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Video(id, res._source));
  });
};

function makeVideoFromHit(hit) {
  var result = new Video(hit._id, hit._source);
  result.timestamp = new Date(result.timestamp);
  return result;
}

/**
 * Get the latest Video
 * @param {User} user
 * @param {esVideoCallback} callback
 */
Video.findLatest = function(user, callback) {
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

    callback(null, makeVideoFromHit(res.hits.hits[0]));
  });
};


function pullVideoIDsInGroups(user, size, iterator, callback) {
  debug("Pulling playlist for video IDs");
  var videoIDs = [];

  var requestOpts = yt.requestOpts(user, 'playlistItems', {
        part: 'contentDetails',
        maxResults: size,
        playlistId: user.services.googleplus.youtubePlaylistID,
        fields: 'items(contentDetails(videoId))'
      });

  yt.pager('next', requestOpts, function(playlistItem, next) {
    videoIDs.push(playlistItem.contentDetails.videoId);
    next();
  }, function() {
    debug("Pulled %s video IDs for user %s", videoIDs.length, user.id);
    var startIndex = 0;

    async.whilst(
      function() { return startIndex < videoIDs.length; },
      function(cb) {
        iterator(videoIDs.slice(startIndex, startIndex+size), cb);
        startIndex += size;
      },
      callback
    );
  });
}

/**
 * Pull YouTube Videos
 * @param {User} user - Keystone user to pull from YouTube for
 * @param {esVideoPullCallback} callback
 */
Video.pull = function(user, callback) {
  debug("pulling video for user id %s", user.id);

  pullVideoIDsInGroups(user, 50, function(videoIDs, nextGroup) {
    var bulkUpdater = new mxm.ElasticsearchBulkManager(500, DELTA_BULK_CREATE_ACTION),
        videos = {},
        requestOpts = yt.requestOpts(user, 'videos', {
          part: 'statistics,snippet,contentDetails',
          id: videoIDs.join(','),
          fields: 'items(id,contentDetails(caption),snippet(channelTitle,publishedAt),statistics)'
        });

    yt.pager('next', requestOpts, function(data, next) {
      var video = new Video(data.id, {
            doc_text: data.contentDetails.caption,
            cadence_user_id: user.id,
            user_id: user.services.googleplus.youtubeChannelID,
            user_name: data.snippet.channelTitle,
            viewCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            commentCount: 0,
            timestamp: new Date(data.snippet.publishedAt)
          });

      video.create(function(err, res, status) {
        if (err && status != 409) return next(err);

        if (!err) {
          debug('video created %j', video);
        }

        video.viewCount = parseInt(data.statistics.viewCount, 10);
        video.likeCount = parseInt(data.statistics.likeCount, 10);
        video.dislikeCount = parseInt(data.statistics.dislikeCount, 10);
        video.commentCount = parseInt(data.statistics.commentCount, 10);

        videos[video.id] = video;
        next();
      });
    }, function(err) {
      if (err) return nextGroup(err);

      var startDate = moment().startOf('day').subtract(2, 'days');

      async.series([
        function(nextTask) {
          keystone.elasticsearch.deleteByQuery({
            index: keystone.get('elasticsearch index'),
            type: DOC_SOURCE + '_delta',
            body: {
              "query": {
                "filtered": {
                  "filter": {
                    "and": [
                      {
                        "range": { "timestamp": { "gte": startDate.toDate() } }
                      },
                      {
                        "terms": { "original_id": _.pluck(videos, "id") }
                      }
                    ]
                  }
                }
              }
            }
          }, nextTask);
        },
        function(nextTask) {
          async.doWhilst(
            function(nextDay) {
              var requestOpts = yt.analyticsRequestOpts(user, 'reports', {
                    ids: 'channel=='+user.services.googleplus.youtubeChannelID,
                    'start-date': startDate.format('YYYY-MM-DD'),
                    'end-date': startDate.format('YYYY-MM-DD'),
                    metrics: [ 'views', 'likes', 'dislikes', 'shares', 'comments' ].join(','),
                    filters: 'video=='+videoIDs.join(','),
                    dimensions: 'video,country'
                  });

              yt.request(requestOpts, function(err, body) {
                if (err || body.error) return nextDay(err || new GoogleAPIError(body));
                if (!body.rows || !body.rows.length) return nextDay();

                async.eachSeries(body.rows, function(row, nextRow) {
                  var video = videos[row[0]],
                      deltaBase = {
                        timestamp: startDate.clone().toDate(),
                        country: row[1]
                      };

                  if (row[2] > 0) {
                    bulkUpdater.addSource(video.deltaBody('viewCount', row[2], deltaBase));
                  }

                  if (row[3] > 0) {
                    bulkUpdater.addSource(video.deltaBody('likeCount', row[3], deltaBase));
                  }

                  if (row[4] > 0) {
                    bulkUpdater.addSource(video.deltaBody('dislikeCount', row[4], deltaBase));
                  }

                  if (row[5] > 0) {
                    bulkUpdater.addSource(video.deltaBody('shareCount', row[5], deltaBase));
                  }

                  if (row[6] > 0) {
                    bulkUpdater.addSource(video.deltaBody('commentCount', row[6], deltaBase));
                  }

                  bulkUpdater.flushIfFull(nextRow);
                }, nextDay);
              });
            }, function() {
              startDate.add(1, 'day');
              return startDate.isBefore(moment());
            }, function(err) {
              if (err) return nextTask(err);
              bulkUpdater.flush(nextTask);
            }
          );
        }
      ], nextGroup);
    });
  }, callback);
};

/**
 * Pull ALL YouTube Video
 * @param {User} user - Keystone user to pull from YouTube for
 * @param {esVideoPullCallback} callback
 */
Video.pullAll = function(user, callback) {
  debug("pulling all videos for user id %s", user.id);

  pullVideoIDsInGroups(user, 50, function(videoIDs, nextGroup) {
    var startDate = new Date(),
        bulkUpdater = new mxm.ElasticsearchBulkManager(500, DELTA_BULK_CREATE_ACTION),
        videos = {},
        requestOpts = yt.requestOpts(user, 'videos', {
          part: 'statistics,snippet,contentDetails',
          id: videoIDs.join(','),
          fields: 'items(id,contentDetails(caption),snippet(channelTitle,publishedAt),statistics)'
        });

    yt.pager('next', requestOpts, function(data, next) {
      var video = new Video(data.id, {
            doc_text: data.contentDetails.caption,
            cadence_user_id: user.id,
            user_id: user.services.googleplus.youtubeChannelID,
            user_name: data.snippet.channelTitle,
            viewCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            commentCount: 0,
            timestamp: new Date(data.snippet.publishedAt)
          });

      if (video.timestamp < startDate) {
        startDate = video.timestamp;
      }

      video.create(function(err) {
        if (err) return next(err);

        debug('video created %j', video);

        video.viewCount = parseInt(data.statistics.viewCount, 10);
        video.likeCount = parseInt(data.statistics.likeCount, 10);
        video.dislikeCount = parseInt(data.statistics.dislikeCount, 10);
        video.commentCount = parseInt(data.statistics.commentCount, 10);

        videos[video.id] = video;
        next();
      });
    }, function(err) {
      if (err) return nextGroup(err);

      startDate = moment(startDate).clone().startOf('day');

      async.doWhilst(
        function(nextDay) {
          var requestOpts = yt.analyticsRequestOpts(user, 'reports', {
                ids: 'channel=='+user.services.googleplus.youtubeChannelID,
                'start-date': startDate.format('YYYY-MM-DD'),
                'end-date': startDate.format('YYYY-MM-DD'),
                metrics: [ 'views', 'likes', 'dislikes', 'shares', 'comments' ].join(','),
                filters: 'video=='+videoIDs.join(','),
                dimensions: 'video,country'
              });

          yt.request(requestOpts, function(err, body) {
            if (err || body.error) return nextDay(err || new GoogleAPIError(body));
            if (!body.rows || !body.rows.length) return nextDay();

            async.eachSeries(body.rows, function(row, nextRow) {
              var video = videos[row[0]],
                  deltaBase = {
                    timestamp: startDate.clone().toDate(),
                    country: row[1]
                  };

              if (row[2] > 0) {
                bulkUpdater.addSource(video.deltaBody('viewCount', row[2], deltaBase));
                video.viewCount = video.viewCount - row[2];
              }

              if (row[3] > 0) {
                bulkUpdater.addSource(video.deltaBody('likeCount', row[3], deltaBase));
                video.likeCount = video.likeCount - row[3];
              }

              if (row[4] > 0) {
                bulkUpdater.addSource(video.deltaBody('dislikeCount', row[4], deltaBase));
                video.dislikeCount = video.dislikeCount - row[4];
              }

              if (row[5] > 0) {
                bulkUpdater.addSource(video.deltaBody('shareCount', row[5], deltaBase));
              }

              if (row[6] > 0) {
                bulkUpdater.addSource(video.deltaBody('commentCount', row[6], deltaBase));
                video.commentCount = video.commentCount - row[6];
              }

              bulkUpdater.flushIfFull(nextRow);
            }, nextDay);
          });
        }, function() {
          startDate = startDate.clone().add(1, 'day');
          return startDate.isBefore(moment());
        }, function(err) {
          if (err) return nextGroup(err);

          _.each(videos, function(video) {
            if (video.viewCount != 0) {
              console.warn("Non-zero ending viewCount %j for video %s", video.viewCount, video.id)
              bulkUpdater.addSource(video.deltaBody('viewCount', video.viewCount, {timestamp: video.timestamp}));
            }

            if (video.likeCount != 0) {
              console.warn("Non-zero ending likeCount %j for video %s", video.likeCount, video.id)
              bulkUpdater.addSource(video.deltaBody('likeCount', video.likeCount, {timestamp: video.timestamp}));
            }

            if (video.dislikeCount != 0) {
              console.warn("Non-zero ending dislikeCount %j for video %s", video.dislikeCount, video.id)
              bulkUpdater.addSource(video.deltaBody('dislikeCount', video.dislikeCount, {timestamp: video.timestamp}));
            }

            if (video.commentCount != 0) {
              console.warn("Non-zero ending commentCount %j for video %s", video.commentCount, video.id)
              bulkUpdater.addSource(video.deltaBody('commentCount', video.commentCount, {timestamp: video.timestamp}));
            }
          });

          bulkUpdater.flush(nextGroup);
        }
      );
    });
  }, callback);
};

/**
 * The object for building a link to the object (text and href)
 */
Video.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: "http://www.youtube.com/watch?v=" + this.id
  };
};


/**
 * Creates the Video in Elasticsearch
 */
Video.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Create a body for a profile delta bulk create
 * @param {Object} data
 * @param {Object} [data.timestamp=now] - Date/time of the change
 * @return {Object} bulk create body
 */
Video.prototype.deltaBody = function() {
  var body = {
        original_id: this.id,
        cadence_user_id: this.cadence_user_id
      };

  var i = 0;

  if ('object' != typeof arguments[0]) {
    body[ arguments[0] ] = arguments[1];
    i = 2;
  }

  while (i < arguments.length) {
    _.extend(body, arguments[i]);
    i++;
  }

  if (!body.timestamp) { // default timestamp
    body.timestamp = new Date();
  }

  return body;
};

/**
 * Creates a delta for the Video in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Video.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = null;
  }

  debug("create Video delta %s", this.id);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: this.deltaBody(key, value, timestamp)
  }, callback);
};

/**
 * Modify the Video by the latest delta
 * @param {esVideoCallback} callback
 */
Video.prototype.modifyByDelta = function(callback) {
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
      aggregations: _.reduce(DELTA_FIELDS,
        function(aggs, fieldName) {
        aggs[fieldName] = { sum: { field: fieldName } };
        return aggs;
      }, {})
    }
  }, function(err, res) {
    if (err) return callback(err);

    _.each(DELTA_FIELDS, function(fieldName) {
      self[fieldName] = res.aggregations[fieldName].value;
    });

    callback(null, self);
  });
};

module.exports = Video;
