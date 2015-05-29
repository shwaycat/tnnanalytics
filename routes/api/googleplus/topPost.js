var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')("cadence:api:googleplus:topPost"),
    request = require('request'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    Post = require('../../../lib/sources/googleplus/post');

exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;
  
  var dataReturn = [];
  endTime = new Date();
  startTime = new Date();
  startTime.setDate(endTime.getDate() - 1000);

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
      if(err) return res.apiResponse({"error": err});

      var posts = mxm.objTry(response, 'hits', 'hits');
          scoredPost = [];
        
        if(!posts || posts.length == 0) return res.apiResponse({"error": "Error with ES search results."});

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
          if(err) return res.apiResponse({"error": err});

          var max = {};
          if(!scoredPost || scoredPost.length == 0) return res.apiResponse({"error": 'Error in async?'});

          max = _.max(scoredPost, function(post) { return post.score; });

          if(!max) return res.apiResponse({"error": "Something went way wrong."})

          dataReturn = {
            success: true,
            type: 'topPost',
            source: 'googleplus',
            queryString: req.query,
            data: max
          }
          return res.apiResponse(dataReturn);


      });
    });
  });
}
