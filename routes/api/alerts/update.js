var keystone = require('keystone'),
    debug = require('debug')('cadence:api:alerts:update'),
    _ = require('underscore'),
    async = require('async'),
    mxm = require('../../../lib/mxm-utils');

function getAllAlertDocs(callback) {
  var PAGE_SIZE = 200,
      results = [],
      resultsTotal = 0;

  async.doWhilst(function(next) {
    keystone.elasticsearch.search({
      index: keystone.get('elasticsearch index'),
      size: PAGE_SIZE,
      from: results.length,
      _source: false,
      body: {
        "query": {
          "terms": {
            "alertState": [ "new", "open" ],
            "minimum_should_match": 1
          }
        }
      }
    }, function(err, response) {
      if(err) return next(err);

      resultsTotal = response.hits.total;

      _.each(mxm.objTry(response, 'hits', 'hits'), function(hit) {
        results.push(_.pick(hit, '_type', '_id'));
      });

      next();
    });
  },
  function() {
    return results.length < resultsTotal;
  },
  function(err) {
    if(err) return callback(err);

    callback(null, results);
  });
}

function updateAlertDocs(alertState, docs, callback) {
  var bulkUpdater = new mxm.ElasticsearchBulkManager();

  async.each(docs, function(doc, nextDoc) {
    bulkUpdater.add({
      update: {
        _index: keystone.get('elasticsearch index'),
        _type: doc._type,
        _id: doc._id
      }
    }, {
      doc: {
        alertState: alertState,
        alertStateUpdatedAt: new Date()
      }
    });
    bulkUpdater.flushIfFull(nextDoc);
  }, function(err) {
    if (err) return callback(err);

    bulkUpdater.flush(function(err) {
      if (err) return callback(err);

      callback(null, _.pluck(docs,'_id'));
    });
  });
}

module.exports = function(req, res, next) {
  if (req.body && !_.isEmpty(req.body)) {
    debug("Body: %j", req.body);
  }

  if (!req.body || _.isEmpty(req.body)) return next(new Error("Bad data: no request body"));
  if (!req.body.alertState) return next(new Error("Bad data: missing alertState"));
  if (!req.body.docs && !req.body.all) return next(new Error("Bad data: missing docs and all"));

  var docs = req.body.docs || [];

  if (!_.isArray(docs)) {
    docs = [docs];
  }

  if (req.body.all) {
    getAllAlertDocs(function(err, foundDocs) {
      if (err) return next(err);

      docs = docs.concat(foundDocs);

      updateAlertDocs(req.body.alertState, docs, function(err) {
        if (err) return next(err);

        return res.apiResponse({
          success: true,
          type: "alerts update",
          ids: docs,
          all: true
        });
      });
    });
  } else {
    updateAlertDocs(req.body.alertState, docs, function(err) {
      if (err) return next(err);

      return res.apiResponse({
        success: true,
        type: "alerts update",
        ids: docs,
        all: false
      });
    });
  }
};
