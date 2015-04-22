var util = require("util")
   , _ = require('underscore')
   , request = require('request')
   , async = require('async')
   , debug = require('debug')('facebook:post')
   , AbstractType = require("../abstract_type")

/**
 * Facebook Post
 * @class
 * @augments AbstractType
 */
function Post(id, obj) {
  AbstractType.call(this, "Facebook", id, obj)
  this.doc_source = "facebook"
  this.doc_type = "post"
}

util.inherits(Post, AbstractType)

/**
 * Pull Facebook Posts
 */
Post.pull = function(user, callback) {
  debug("pulling for user id %s", user.id)

  user.facebookPages(function(err, pages) {
    if (err) {
      return callback(err)
    }

    var lastPostTime = null

    async.eachSeries(pages, function(page, nextPage) {
      if (err) {
        return nextPage(err)
      }

      var qp = 'fields=id,message,created_time,from'
      // We've made a query already, let's not get anything before that tweet
      if (user.services.facebook.lastPostTime && user.services.facebook.lastPostTime != '') {
        qp + '&since=' + user.services.facebook.lastPostTime;
      }
      // if(days_to_pull > -1) {
      //   var since = Math.floor((new Date((new Date()).getTime() - days_to_pull * 24 * 60 * 60 * 1000)).getTime() / 1000);
      //   qp + '&since=' + since;
      // }

      request({
        url: 'https://graph.facebook.com/v2.3/' + page.id + '/feed?' + qp + '&access_token=' + page.access_token,
        json: true
      }, function (err, res, body) {
        if (err) {
          console.error("Error getting posts for user %s, page %s\n%s", user.id, page.id, body)
          nextPage(err)
        } else {
          debug("%s posts", body.data.length)
          async.eachLimit(body.data, 5, function(postData, next) {
            var post = new Post(postData.id)
            _.extend(mention, {
              doc_text: postData.message,
              user_id: postData.from ? postData.from.id : null
              user_name: postData.from ? postData.from.name : null,
              // user_lang: postData.from ? postData.from.languages[0] : null,
              cadence_user_id: user.id,
              time_stamp: postData.created_time,
              page_id: page.id
              // access_token: page.access_token,
              // notified: postData && postData.from.name != user.services.facebook.username
            })
            post.create(function(err, res) {
              if (err) {
                //TODO test for and ignore duplicate creation
                next(err)
              } else {
                debug("created post %s", post.id)
                if (post.created_time > lastPostTime) {
                  lastPostTime = post.created_time
                }
                next()
              }
            })
          }, nextPage)
          //TODO if body.paging.next - get next page
        }
      })
    }, function(err) {
      if (err) {
        return callback(err)
      } else {
        debug("updating lastPostTime for %s to %s", user.id, lastPostTime)
        user.set('services.facebook.lastPostTime', lastPostTime)
        user.save(callback)
      }
    })
  })
}

/**
 * The object for building a link to the object (text and href)
 */
Post.prototype.emailLinkObject = function(opts) {
  var idParts = this.id.split("_")
  return {
    text: this.emailLinkText(),
    href: 'https://www.facebook.com/permalink.php?story_fbid=' + idParts[1] + '&id=' + this.page_id
  }
}

/**
 * Creates the Post in Elasticsearch
 */
Post.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback)
}

module.exports = Post
