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
      var size = 100,
          from = 0,
          total = 0,
          docs = [];

      async.doWhilst(function(callback) {
        keystone.elasticsearch.search({
          index: keystone.get('elasticsearch index'),
          size: size,
          from: from,
          body: {
            "query": {
              "filtered": {
                "filter": {
                  "or": {
                    "filters": [
                      { "term": { "alertState": "open"} },
                      { "term": { "alertState": "new" } }
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
            docs = docs.concat(hits);

            total = response.hits.total;
            from += size;
            callback();
          } else {
            callback(new Error('No Hits in ES'));
          }
        });
      },
      function() {
        return (from + size) <= total;
      },
      function(err) {
        if(err) return res.apiResponse({"error": err});
 
        bulkUpdate(args, docs, function(err) {
          if(err) return res.apiResponse({"error": err});

          return res.apiResponse({
            success: true,
            type: "alerts update",
            ids: _.pluck(docs,'_id'),
            all: true
          });
        });
      });


    } else {
      console.log(from);
      bulkUpdate(args, docs, function(err) {
        if(err) return res.apiResponse({"error": err});

        return res.apiResponse({
          success: true,
          type: "alerts update",
          ids: _.pluck(docs,'_id')
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
          _type: doc._type,
          _id: doc._id
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

