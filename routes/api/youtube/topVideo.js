var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')("cadence:api:youtube:topVideo"),
    request = require('request'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    Video = require('../../../lib/sources/youtube/video');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;
  
  var dataReturn = [];
  endTime = new Date();
  startTime = new Date();
  startTime.setDate(endTime.getDate() - 90);

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }


  // Build Response Here
  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return apiResponse({'error': err});

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
      if(err) return res.apiResponse({"error": err});

      var videos = mxm.objTry(response, 'hits', 'hits');
          scoredVideos = [];
        
        if(!videos || videos.length == 0) return res.apiResponse({"error": "Error with ES search results."});

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
                dislikeCount: video.dislikeCount || 0,
                commentCount: video.commentCount || 0,
                shareCount: video.shareCount || 0,
                score: (parseInt(video.viewCount) || 0) + (parseInt(video.likeCount) || 0) + (parseInt(video.commentCount) || 0) + (parseInt(video.shareCount) || 0) - (parseInt(video.dislikeCount) || 0)
              });
              nextVideo();
            });
          });
        }, function(err) {
          if(err) return res.apiResponse({"error": err});

          var max = {};
          if(!scoredVideos || scoredVideos.length == 0) return res.apiResponse({"error": 'Error in async?'});

          max = _.max(scoredVideos, function(video) { return video.score; });

          if(!max) return res.apiResponse({"error": "Something went way wrong."})

          dataReturn = {
            success: true,
            type: 'topPost',
            source: 'youtube',
            queryString: req.query,
            data: max
          }
          return res.apiResponse(dataReturn);



      });
    });
  });
}
