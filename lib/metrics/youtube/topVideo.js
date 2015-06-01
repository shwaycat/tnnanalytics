var keystone = require('keystone'),
    async = require('async'),
    // debug = require('debug')('cadence:metrics:youtube:topVideo'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore'),
    Video = require('../../../lib/sources/youtube/video');

module.exports = function(user, startTime, endTime, callback) {
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      from: 0,
      size: 1000000000,
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                  "term": { "doc_type": "video" }
                },
                {
                  "range": {
                    "timestamp": {
                      "gte": startTime,
                      "lte": endTime
                    }
                  }
                },
                {
                  "term": { "cadence_user_id": accountRoot.id }
                }
              ]
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback(err);

      var videos = mxm.objTry(response, 'hits', 'hits'),
          scoredVideos = [];

      // No Top Video for time period
      if(!videos || !videos.length) return callback(null, {data: null});

      async.eachSeries(videos, function(video, nextVideo) {
        Video.findOne(video._id, function(err, video) {
          if(err) return nextVideo(err);

          video.modifyByDelta(function(err) {
            if (err) return nextVideo(err);

            scoredVideos.push({
              id: video.id,
              url: video.url,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
              shareCount: video.shareCount,
              score: video.viewCount + video.likeCount + video.commentCount + video.shareCount
            });

            nextVideo();
          });
        });
      }, function(err) {
        if(err) return callback(err);

        var data = _.max(scoredVideos, function(video) { return video.score; });

        return callback(null, {data: data});
      });
    });
  });
};
