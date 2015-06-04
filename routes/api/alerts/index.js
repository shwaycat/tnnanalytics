var keystone = require('keystone'),
    _ = require('underscore'),
    mxm = require('../../../lib/mxm-utils'),
    User = keystone.list('User'),
    sources = {
      facebook: require('../../../lib/sources/facebook'),
      twitter: require('../../../lib/sources/twitter'),
      instagram: require('../../../lib/sources/instagram'),
      youtube: require('../../../lib/sources/youtube'),
      googleplus: require('../../../lib/sources/googleplus')
    };


module.exports = function(req, res, next) {
  var page = req.query.page || 1,
      size = 15;

  User.model.getAccountRootInfo(req.user.accountName, function(err, accountRoot) {
    if (err) return next(err);

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
                    "exists": { "field": "alertState" }
                  },
                  {
                    "term": { "cadence_user_id": accountRoot.id }
                  }
                ]
              }
            },
            "functions": [
              {
                "filter": {
                  "term": { "alertState": "new" }
                },
                "weight": 3
              },
              {
                "filter": {
                  "term": { "alertState": "open" }
                },
                "weight": 2
              },
              {
                "filter": {
                  "term": { "alertState": "closed" }
                },
                "weight": 1.5
              }
            ]
          }
        },
        "sort": [
          {
            "_score": { "order": "desc" }
          },
          {
            "timestamp": { "order": "desc" }
          }
        ],
        "track_scores": true
      }
    }, function(err, response){
      if(err) return next(err);

      var hits = mxm.objTry(response, 'hits', 'hits'),
          total = response.hits.total,
          data = [];

      data = _.map(hits, function(hit) {
        var alertType = sources[hit._source.doc_source][hit._source.doc_type],
            alert = new alertType(hit._id, hit._source);

        alert._type = alert.doc_source;
        alert._id = alert.id;
        alert.url = alert.emailLinkObject({ user: accountRoot }).href;

        return alert;
      });

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
};
