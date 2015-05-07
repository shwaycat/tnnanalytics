var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    mxm = require('../../../lib/mxm-utils');


exports = module.exports = function(req, res) {
  var locals = res.locals,
      args = req.body,
      docs;

  if(args && args.alertState && (args.docs || args.all)) {
    docs = args.docs;
    
    if(!_.isArray(docs)) {
      docs = [docs];
    }

    if(args.all) {
      keystone.elasticsearch.search({
        index: keystone.get('elasticsearch index'),
        body: {
          "query": {
            "filtered": {
              "filter": {
                "or": {
                  "filters": [
                    { "term": { "alertState": "open"} },
                    { "term": { "alertState": "new" } },
                    { "term": { "alertState": "closed" } }
                  ]
                }
              }
            }
          }
        }
      }, function(err, response) {
        if(err) return res.apiResponse({"error": err});
        var hits = mxm.objTry(response, 'hits', 'hits');
        if(hits && hits.length) {
          docs = [];
          docs = _.each(hits, function(obj, index, list) {
            list[index] = {
              id: obj._id,
              doc_type: obj._type
            };
          });

          bulkUpdate(args, docs, function(err) {
            if(err) return res.apiResponse({"error": err});

            return res.apiResponse({
              success: true,
              type: "alerts update",
              ids: _.pluck(docs,'id'),
              all: true
            });
          });
        } else {
          return res.apiResponse({"error": 'All Not Possible'});
        }
      });
    } else {

      bulkUpdate(args, docs, function(err) {
        if(err) return res.apiResponse({"error": err});

        return res.apiResponse({
          success: true,
          type: "alerts update",
          ids: _.pluck(docs,'id')
        });
      });
    }

  } else {
    return res.apiResponse({error: "Bad data"});
  }
  
}

function bulkUpdate(args, docs, callback) {
  var bulkUpdates = [];

  for(i=0;i<docs.length;i++) {
    doc = docs[i];

    bulkUpdates.push({ 
        update: {
          _index: keystone.get('elasticsearch index'),
          _type: doc.doc_type,
          _id: doc.id
        }
      },
      {
        doc: {
          alertState: args.alertState,
          alertStateUpdatedAt: new Date()
        }
      });
  }

  keystone.elasticsearch.bulk({
    body: bulkUpdates
  }, function(err, response) {
    if (err) return callback(err);
    
    callback();
  });
}

