var keystone = require('keystone'),
    moment = require('moment'),
    // debug = require('debug')('cadence:api:facebook:topPost'),
    mxm = require('../../../lib/mxm-utils'),
    _ = require('underscore'),
    async = require('async'),
    User = keystone.list('User'),
    Post = require('../../../lib/sources/facebook/post');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return res.apiResponse({ error: err });

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
        }
      }
    }, function(err, response) {
      if(err) return res.apiResponse({ error: err });

      var posts = mxm.objTry(response, 'hits', 'hits'),
          topPost;

      if(!posts || !posts.length) {
        return res.apiResponse({ error: "Error with ES search results." });
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
        if(err) return res.apiResponse({ error: err});

        res.apiResponse({
          success: true,
          type: 'topPost',
          source: 'facebook',
          queryString: req.query,
          data: _.extend(topPost, {
            url: topPost.emailLinkObject().href,
            score: topPost.score()
          })
        });
      });
    });
  });
};
