var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:youtube:topVideo'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore'),
    Video = require('../../../lib/sources/youtube/video');

module.exports = function(user, startTime, endTime, callback) {

  // Build Response Here
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback({'error': err});

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      from: 0,
      size: 1000000000,
      body: {
        "query": {
          "filtered": {
            "query": {
              "term": {
                "doc_type": {
                  "value": "video"
                }
              }
            },
            "filter": {
              "and": {
                "filters": [
                  {
                    "range": {
                      "timestamp": {
                        "gte": startTime,
                        "lte": endTime
                      }
                    }
                  },
                  {
                    "term": {
                      "cadence_user_id": accountRoot.id
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return callback({"error": err});

      var videos = mxm.objTry(response, 'hits', 'hits');
          scoredVideos = [];
        
        // No Top Video for time period
        if(!videos || videos.length == 0) return callback({data:null});

        async.eachSeries(videos, function(video, nextVideo) {
          Video.findOne(video._id, function(err, video) {
            if(err) return nextVideo(err);

            video.modifyByDelta(function(err) {
              if (err) return nextVideo(err);

              scoredVideos.push({
                id: video.id,
                url: video.url,
                viewCount: video.viewCount || 0,
                likeCount: video.likeCount || 0,
                commentCount: video.commentCount || 0,
                shareCount: video.shareCount || 0,
                score: (parseInt(video.viewCount) || 0) + (parseInt(video.likeCount) || 0) + (parseInt(video.commentCount) || 0) + (parseInt(video.shareCount) || 0)
              });
              nextVideo();
            });
          });
        }, function(err) {
          if(err) return callback({"error": err});

          var max = {};
          if(!scoredVideos || scoredVideos.length == 0) return callback({"error": 'Error in async?'});

          max = _.max(scoredVideos, function(video) { return video.score; });

          if(!max) return callback({"error": "Something went way wrong."})

          dataReturn = {
            data: max
          }
          return callback(dataReturn);



      });
    });
  });

}
