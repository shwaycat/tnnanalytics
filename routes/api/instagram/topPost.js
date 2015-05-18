var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')("cadence:api:instagram:topPost"),
    request = require('request'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    Media = require('../../../lib/sources/instagram/media'),
    insta = require('../../../lib/sources/instagram/insta');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals;
  
  var dataReturn = [];
  endTime = new Date();
  startTime = new Date();
  startTime.setDate(endTime.getDate() - 30);

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
      if(err) return res.apiResponse({"error": err});

      var medias = mxm.objTry(response, 'hits', 'hits');
          scoredMedia = [];
        
        if(!medias || medias.length == 0) return res.apiResponse({"error": "Error with ES search results."});

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
          if(err) return res.apiResponse({"error": err});

          var max = {};
          if(!scoredMedia || scoredMedia.length == 0) return res.apiResponse({"error": 'Error in async?'});

          max = _.max(scoredMedia, function(media) { return media.score; });

          if(!max) return res.apiResponse({"error": "Something went way wrong."})

          keystone.elasticsearch.get({
            index: keystone.get('elasticsearch index'),
            type: 'instagram',
            id: max.id
          }, function(err, media) {
            if(err) return res.apiResponse({"error": "Failed in ES.get"});


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
                  success: true,
                  type: 'topPost',
                  source: 'instagram',
                  queryString: req.query,
                  data: max,
                  oembed: media.oembed
                };

                return res.apiResponse(dataReturn);

              });
            } else {
              dataReturn = {
                success: true,
                type: 'topPost',
                source: 'instagram',
                queryString: req.query,
                data: max,
                oembed: JSON.parse(media._source.oembed)
              }
              return res.apiResponse(dataReturn);

            }


          });



      });
    });
  });
}
