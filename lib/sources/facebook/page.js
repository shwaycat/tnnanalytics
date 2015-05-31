var util = require("util"),
    _ = require('underscore'),
    fb = require('./fb'),
    async = require('async'),
    keystone = require('keystone'),
    debug = require('debug')('cadence:facebook:page'),
    AbstractType = require("../abstract_type"),
    SOURCE_NAME = 'Facebook',
    DOC_SOURCE = 'facebook',
    DOC_TYPE = 'page',
    DELTA_FIELDS = [ 'likes' ];

/**
 * Facebook Page
 * @class
 * @augments AbstractType
 */
function Page(id, obj) {
  AbstractType.call(this, SOURCE_NAME, id, obj);
  this.doc_source = DOC_SOURCE;
  this.doc_type = DOC_TYPE;
}

util.inherits(Page, AbstractType);

/**
 * Get a Page
 * @param {string} id
 * @param {esPageCallback} callback
 */
Page.findOne = function(id, callback) {
  keystone.elasticsearch.get({
    index: keystone.get('elasticsearch index'),
    type: DOC_SOURCE,
    id: id
  }, function(err, res) {
    if (err && !res.found) return callback(null, null);
    if (err) return callback(err);

    callback(null, new Page(id, res._source));
  });
};

/**
 * Creates a delta for the Page in Elasticsearch
 * @param {string} key - Field name
 * @param {string} value - New value for the field
 * @param {Date} [timestamp=now] - Date/time of the change
 * @param {esCreateCallback} callback
 */
Page.prototype.createDelta = function(key, value, timestamp, callback) {
  if (_.isFunction(timestamp)) { // default timestamp
    callback = timestamp;
    timestamp = new Date();
  }

  var body = {
        original_id: this.id,
        timestamp: timestamp
      };

  if ('object' == typeof value) {
    _.extend(body, value);
  } else {
    body[key] = value;
    body['doc_source'] = DOC_SOURCE;
  }

  debug("create page delta %j", body);

  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: body
  }, callback);
};

/**
 * Pull recent Facebook Page data
 * @param {User} user
 * @param {function} callback
 */
Page.pull = function(user, callback) {
  var pageID = user.services.facebook.pageID;

  debug("pulling page for user id %s, page %s", user.id, pageID);

  Page.findOne(pageID, function(err, page) {
    if (err) return callback(err);
    if (!page) return callback(new Error("Page does not exist"));

    var requestOpts = fb.requestOpts(user, pageID, { fields: 'likes' });

    page.modifyByDelta(function(err, page) {
      if (err) return callback(err);

      fb.request(requestOpts, function (err, body) {
        if (err) return callback(err);

        if (page.likes == body.likes) {
          return callback();
        }

        page.createDelta('likes', body.likes, callback);
      });
    });
  });
};

/**
 * Pull all available data for the Facebook Page
 * @param {User} user
 * @param {function} callback
 */
Page.pullAll = function(user, callback) {
  var pageID = user.services.facebook.pageID,
      page = new Page(pageID, {
        timestamp: new Date(),
        cadence_user_id: user.id,
        likes: 0
      });

  debug("pulling all page data for user id %s, page %s", user.id, pageID);

  page.create(function(err) {
    if (err) return callback(err);

    async.series([
      function(done) {
        var requestOpts = fb.requestOpts(user, pageID, 'insights', 'page_fans', 'lifetime'),
            previousValue = null;

        fb.pager('previous', requestOpts, function(obj, next) {
          if (!obj.value) return next('stop');
          if (previousValue === obj.value) return next();

          previousValue = obj.value;
          page.timestamp = new Date(obj.end_time);

          page.createDelta('likes', obj.value, page.timestamp, function(err) {
            if (err) return next(err);
            if (obj.value === 0) return next('stop');
            next();
          });
        }, function(err) {
          if (err) return done(err);

          if (previousValue) {
            page.update(done);
          } else {
            done();
          }
        });
      },
      function(done) {
        var requestOpts = fb.requestOpts(user, pageID, 'insights', 'page_fans_country', 'lifetime');

        fb.pager('previous', requestOpts, function(obj, next) {
          if (!obj.value) return next('stop');
          if (obj.value.length == 0) return next('stop');

          obj.end_time = new Date(obj.end_time);
          if (obj.end_time < page.timestamp) return next('stop');

          async.eachSeries(_.keys(obj.value), function(key, nextKey) {
            var data = {
              country: key,
              likesByCountry: obj.value[key]
            };

            page.createDelta('likesByCountry', data, obj.end_time, nextKey);
          }, next);
        }, done);
      },
      function(done) {
        var requestOpts = fb.requestOpts(user, pageID, 'insights', 'page_impressions', 'day');

        fb.pager('previous', requestOpts, function(obj, next) {
          obj.end_time = new Date(obj.end_time);
          if (obj.end_time < page.timestamp) return next('stop');

          page.createDelta('impressions', obj.value, obj.end_time, next);
        }, done);
      }
    ], callback);
  });
};

/**
 * Creates the Page in Elasticsearch
 * @param {esCreateCallback} callback
 */
 Page.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * Update the Page in Elasticsearch
 * @param {function} callback
 */
Page.prototype.update = function(callback) {
  keystone.elasticsearch.index({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback);
};

/**
 * The object for building a link to the object (text and href)
 * @returns {Object} object with text and href
 */
Page.prototype.emailLinkObject = function() {
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/' + this.id
  };
};


/**
 * Modify the Mention by the latest delta
 * @param {esPageCallback} callback
 */
Page.prototype.modifyByDelta = function(callback) {
  var self = this;

  keystone.elasticsearch.search({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source + '_delta',
    body: {
      query: {
        filtered: {
          filter: {
            term: { original_id: this.id }
          }
        }
      },
      aggregations: {
        deltas: {
          filters: {
            filters: _.map(DELTA_FIELDS, function(fieldName) {
              return { exists: { field: fieldName } };
            })
          },
          aggregations: {
            last_delta: {
              top_hits: {
                sort: [
                  { _timestamp: { order: 'desc' } }
                ],
                size: 1
              }
            }
          }
        }
      }
    }
  }, function(err, res) {
    if (err) return callback(err);

    DELTA_FIELDS.forEach(function(fieldName, i) {
      var delta = res.aggregations.deltas.buckets[i].last_delta.hits.hits[0];
      if(delta) {
        self[fieldName] = delta._source[fieldName];
      }
    });

    callback(null, self);
  });
};

module.exports = Page;
