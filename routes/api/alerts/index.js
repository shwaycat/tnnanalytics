var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    mxm = require('../../../lib/mxm-utils'),
    sources = {
      facebook: require('../../../lib/sources/facebook'),
      twitter: require('../../../lib/sources/twitter')
    };;


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals,
      page = req.query.page,
      size = 15,
      user = req.user;

  if(!page) {
    page = 1;
  }

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    "size": size,
    "from": (page-1) * size,
    body: {
      "query": {
        "filtered": {
          "filter": {
            "exists": { "field": "alertState" }
          }
        }
      }
    }
  }, function(err, response){
    if(err) return res.apiResponse({"error": err});
    
    var alerts = mxm.objTry(response, 'hits', 'hits');
    var data = [];

    if(_.isArray(alerts)) {
      for(i=0;i<alerts.length;i++) {
        alert = {};
        alert = _.pick(alerts[i]['_source'], "sourceName", "doc_source", "doc_type", "cadence_user_id", "user_id", "timestamp", "alertState", "alertStateUpdatedAt");
        alert.id = alerts[i]['_id'];

        DOCTYPE = sources[alert.doc_source][alert.doc_type];
        DOC = new DOCTYPE(alert.id, alerts[i]['_source']);

        emailLinkObject = DOC.emailLinkObject({user: user});

        alert.url = emailLinkObject.href;

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
      data: data
    });

  });
  
}
