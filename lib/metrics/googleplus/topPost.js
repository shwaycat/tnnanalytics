var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:googleplus:topPost'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore'),
    async = require('async'),
    request = require('request'),
    Post = require('../../../lib/sources/googleplus/post');

module.exports = function(user, startTime, endTime, callback) {

  // Build Response Here
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      from: 0,
      size: 1000000000,
      type: "googleplus",
      body: {
        "query": {
          "filtered": {
            "query": {
              "term": {
                "doc_type": {
                  "value": "post"
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
      if(err) return callback(err);

      var posts = mxm.objTry(response, 'hits', 'hits');
          scoredPost = [];
        
        // No Top Post for time period
        if(!posts || posts.length == 0) return callback(null, {data:null});

        async.eachSeries(posts, function(post, nextPost) {
          Post.findOne(post._id, function(err, post) {
            if(err) return nextPost(err);

            post.modifyByDelta(function(err) {
              if (err) return nextPost(err);

              scoredPost.push({
                id: post.id,
                url: post.url,
                plusoners: (post.plusoners || 0),
                comments: (post.comments || 0),
                resharers: (post.resharers || 0),
                score: (post.plusoners || 0) + (post.comments || 0) + (post.resharers || 0)
              });
              nextPost();
            });
          });
        }, function(err) {
          if(err) return callback(err);

          var max = {};

          max = _.max(scoredPost, function(post) { return post.score; });

          dataReturn = {
            data: max
          }
          return callback(null, dataReturn);

      });
    });
  });

}