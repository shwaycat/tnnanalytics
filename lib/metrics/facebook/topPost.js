var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:metrics:facebook:topPost'),
    mxm = require('../../../lib/mxm-utils'),
    _ = require('underscore'),
    async = require('async'),
    User = keystone.list('User'),
    Post = require('../../../lib/sources/facebook/post');


module.exports = function(user, startTime, endTime, callback) {

  debug("startTime: %s, endTime: %s", startTime, endTime);

  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback({ error: err });

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      from: 0,
      size: 1000000000,
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                { "term": { "doc_type": "post" } },
                { "term": { "cadence_user_id": accountRoot.id } },
                {
                  "range": {
                    "timestamp": { "gte": startTime, "lte": endTime }
                  }
                }
              ]
            }
          }
        },
        "sort": [
          { "timestamp": "desc" }
        ]
      }
    }, function(err, response) {
      if(err) return callback({ error: err });

      var posts = mxm.objTry(response, 'hits', 'hits'),
          topPost;

      if(!posts || !posts.length) {
        return callback({ error: "Error with ES search results." });
      }

      async.eachSeries(posts, function(postHit, next) {
        var post = new Post(postHit._id, postHit._source);

        post.modifyByDelta(function(err, post) {
          if (err) return next(err);

          if (!topPost || post.score() > topPost.score()) {
            topPost = post;
          }
          next();
        });
      }, function(err) {
        if(err) return callback({ error: err});

        topPost.data = {
          url: topPost.embedURL(),
          score: topPost.score()
        };

        return callback({
          data: topPost
        });
      });
    });
  });

}