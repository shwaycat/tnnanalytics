var keystone = require('keystone'),
    debug = require('debug')('cadence:metrics:instagram:topPost'),
    mxm = require('../../mxm-utils'),
    User = keystone.list('User'),
    _ = require('underscore'),
    async = require('async'),
    request = require('request'),
    Media = require('../../../lib/sources/instagram/media'),
    insta = require('../../../lib/sources/instagram/insta');

module.exports = function(user, startTime, endTime, callback) {

  // Build Response Here
  User.model.getAccountRootInfo(user.accountName, function(err, accountRoot) {
    if (err) return callback(err);

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
                  "value": "media"
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
                  },
                  {
                    "term": {
                      "user_id": accountRoot.services.instagram.profileId
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

      var medias = mxm.objTry(response, 'hits', 'hits');
          scoredMedia = [];
        
        // No Top Post for this time period
        if(!medias || medias.length == 0) return callback(null, {data:null, oembed:null});

        async.eachSeries(medias, function(media, nextMedia) {
          Media.findOne(media._id, function(err, media) {
            if(err) return nextMedia(err);

            media.modifyByDelta(function(err) {
              if (err) return nextMedia(err);

              scoredMedia.push({
                id: media.id,
                url: media.url,
                likes: media.likes || 0,
                comments: media.comments || 0,
                score: (media.likes || 0) + (media.comments || 0)
              });
              nextMedia();
            });
          });
        }, function(err) {
          if(err) return callback(err);

          var max = {};

          max = _.max(scoredMedia, function(media) { return media.score; });

          keystone.elasticsearch.get({
            index: keystone.get('elasticsearch index'),
            type: 'instagram',
            id: max.id
          }, function(err, media) {
            if(err) return callback(err);

            if(!media._source.oembed) {
              debug("GO GET IT!");
              async.series([
                function(next) {
                  request({
                    url: 'http://api.instagram.com/oembed?url=' + media._source.url,
                    json: true
                  }, function (err, response, body) {
                    if(err) return next(err);

                    media.oembed = body;
                    next();
                 
                  });

                },
                function(next) {
                  keystone.elasticsearch.update({
                    index: keystone.get('elasticsearch index'),
                    type: 'instagram',
                    id: media._id,
                    body: {
                      doc: {
                        oembed: JSON.stringify(media.oembed)
                      }
                    }
                  }, function (err, response) {
                    if(err) return next(err);

                    return next();
                  });  
                }
              ], 
              function(err) {
                dataReturn = {
                  data: max,
                  oembed: media.oembed
                };

                return callback(null, dataReturn);

              });
            } else {
              dataReturn = {
                data: max,
                oembed: JSON.parse(media._source.oembed)
              }
              return callback(null, dataReturn);

            }


          });



      });
    });
  });
 
}