var keystone = require('keystone'),
    moment = require('moment'),
    debug = require('debug')('cadence:api:facebook:engagement'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore');

module.exports = function(req, res) {
  var startTime = moment().subtract(1, 'month').toDate(),
      endTime = new Date();

  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }

  var interval = Math.floor((endTime.getTime() - startTime.getTime()) / 24 / 1000);

  if (interval < 86400) { // min. resolution is 1 day
    interval = 86400;
  }

  debug("startTime: %s, endTime: %s, interval: %s", startTime, endTime, interval);

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return res.apiResponse({ error: err });

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      type: 'facebook,facebook_delta',
      body: {
        "query": {
          "filtered": {
            "filter": {
              "and": [
                {
                  "range": {
                    "timestamp": { "gte": startTime, "lte": endTime }
                  }
                },
                {
                  "or": [
                    { "term": { "cadence_user_id": accountRoot.id } },
                    { "term": { "original_id": accountRoot.services.facebook.pageID } }
                  ]
                },
                {
                  "or": [
                    { "terms": { "doc_type": [ "comment", "mention", "message" ] } },
                    {
                      "and": [
                        { "terms": { "doc_type": [ "post", "status" ] } },
                        {
                          "or": [
                            { "exists": { "field": "likes" } },
                            { "exists": { "field": "shares" } }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        "aggs": {
          "engagement": {
            "date_histogram": {
              "field": "timestamp",
              "interval": interval + "s",
              "min_doc_count": 0
            },
            "aggs": {
              "likes": {
                "max": {
                  "field": "likes"
                }
              },
              "shares": {
                "max": {
                  "field": "shares"
                }
              },
              "doc_types": {
                "terms": {
                  "field": "doc_type",
                  "size": 0
                }
              }
            }
          }
        }
      }
    }, function(err, response) {
      if(err) return res.apiResponse({ error: err });

      var buckets = mxm.objTry(response, 'aggregations', 'engagement', 'buckets');

      buckets = _.sortBy(buckets, function(bucket) {
        return bucket.key;
      });

      if(buckets && buckets.length) {
        var summary = {
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          totalMentions: 0,
          totalMessages: 0
        };

        var data = _.map(buckets, function(bucket) {
              var result = {
                    key: bucket.key_as_string,
                    value: bucket.likes.value + bucket.shares.value
                  };

              summary.totalLikes += bucket.likes.value || 0;
              summary.totalShares += bucket.shares.value || 0;

              _.each(bucket.doc_types.buckets, function(b) {
                if (!b.doc_count) return;
                switch (b.key) {
                  case 'post':
                  case 'status':
                    result.value += b.doc_count;
                    break;
                  case 'mention':
                    summary.totalMentions += b.doc_count;
                    break;
                  case 'comment':
                    summary.totalComments += b.doc_count;
                    break;
                  case 'message':
                    summary.totalMessages += b.doc_count;
                    break;
                  //TODO default: make error
                }
              });

              return result;
            });

        if(buckets.length == 1) {
          data.unshift({
            key: startTime.toISOString(),
            value: _.first(data).value
          });
          data.push({
            key: endTime.toISOString(),
            value: _.last(data).value
          });
        }

        return res.apiResponse({
          success: true,
          type: 'acquisition',
          source: 'facebook',
          queryString: req.query,
          data: data,
          summary: summary
        });
      } else {
        res.apiResponse({ error: "No buckets." });
      }
    });
  });
};
