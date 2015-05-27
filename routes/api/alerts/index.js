var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    sources = {
      facebook: require('../../../lib/sources/facebook'),
      twitter: require('../../../lib/sources/twitter'),
      instagram: require('../../../lib/sources/instagram'),
      youtube: require('../../../lib/sources/youtube')
    };


exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
      locals = res.locals,
      page = req.query.page,
      size = 15,
      total = 0;

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return apiResponse({'error': err});

    if(!page) {
      page = 1;
    }

    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      size: size,
      from: (page-1) * size,
      body: {
        "query": {
          "function_score": {
            "filter": {
              "and": {
                "filters": [
                  {
                    "exists": {
                      "field": "alertState"
                    }
                  },
                  {
                    "term": {
                      "cadence_user_id": accountRoot.id
                    }
                  }
                ]
              }
            },
            "functions": [
              {
                "filter": {
                  "term": {
                    "alertState": "new"
                  }
                },
                "weight": 3
              },
              {
                "filter": {
                  "term": {
                    "alertState": "open"
                  }
                },
                "weight": 2
              },
              {
                "filter": {
                  "term": {
                    "alertState": "closed"
                  }
                },
                "weight": 1.5
              }
            ]
          }
        },
        "sort": [
          {
            "_score": {
              "order": "desc"
            }
          },
          {
            "timestamp": {
              "order": "desc"
            }
          }
        ],
        "track_scores": true
      }
    }, function(err, response){
      if(err) return res.apiResponse({"error": err});

      var alerts = mxm.objTry(response, 'hits', 'hits');
      var data = [];

      if(_.isArray(alerts)) {
        for(i=0;i<alerts.length;i++) {

          _source = _.pick(alerts[i]['_source'], "sourceName", "doc_source", "doc_type", "cadence_user_id", "user_id", "timestamp", "alertState", "alertStateUpdatedAt")
          alert = _.pick(alerts[i], "_id", "_type");
          alert = _.extend(alert, _source);

          DOCTYPE = sources[alert.doc_source][alert.doc_type];
          DOC = new DOCTYPE(alert._id, alerts[i]['_source']);

          emailLinkObject = DOC.emailLinkObject({user: user});

          alert.url = emailLinkObject.href;
          total = response.hits.total;

          data.push(alert);
        }
      } else {
        return res.apiResponse({"error": "Error with ES results."});
      }

      return res.apiResponse({
        success: true,
        type: 'alerts',
        page: page,
        source: 'all',
        pageSize: size,
        total: total,
        data: data
      });

    });
  });

}
