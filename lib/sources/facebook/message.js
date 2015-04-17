var util = require("util")
   , _ = require('underscore')
   , request = require('request')
   , async = require('async')
   , debug = require('debug')('facebook:message')
   , AbstractType = require("../abstract_type")

/**
 * Facebook Message
 * @class
 * @augments AbstractType
 */
function Message(id, obj) {
  AbstractType.call(this, "Facebook", id, obj)
  this.doc_source = "facebook"
  this.doc_type = "message"
}

util.inherits(Message, AbstractType)

/**
 * Pull Facebook Messages
 */
Message.pull = function(user, callback) {
  debug("pulling for user id %s", user.id)

  user.facebookPages(function(err, pages) {
    if (err) {
      return callback(err)
    }

    var lastMessageTime = null

    async.eachSeries(pages, function(page, nextPage) {
      if (err) {
        return nextPage(err)
      }

      var qp = 'fields=id,updated_time,messages'
      // We've made a query already, let's not get anything before that tweet
      if (user.services.facebook.lastMessageTime && user.services.facebook.lastMessageTime != '') {
        qp + '&since=' + user.services.facebook.lastMessageTime;
      }
      // if(days_to_pull > -1) {
      //   var since = Math.floor((new Date((new Date()).getTime() - days_to_pull * 24 * 60 * 60 * 1000)).getTime() / 1000);
      //   qp + '&since=' + since;
      // }

      request({
        url: 'https://graph.facebook.com/v2.3/' + page.id + '/conversations?' + qp + '&access_token=' + page.access_token;
        json: true
      }, function (err, res, body) {
        if (err) {
          console.error("Error getting messages for user %s, page %s\n%s", user.id, page.id, body)
          nextPage(err)
        } else {
          debug("%s message conversations", body.data.length)
          async.eachLimit(body.data, 5, function(conversation, nextConversation) {
            async.eachLimit(conversation.messages.data, 5, function (messageData, next) {
              var message = new Message(messageData.id)
              _.extend(message, {
                doc_text: messageData.message,
                user_id: messageData.from ? messageData.from.id : null
                user_name: messageData.from ? messageData.from.name : null,
                // user_lang: messageData.from ? messageData.from.languages[0] : null,
                cadence_user_id: user.id,
                time_stamp: messageData.created_time,
                page_id: page.id
              })
              message.create(function(err, res) {
                if (err) {
                  //TODO test for and ignore duplicate creation
                  next(err)
                } else {
                  debug("created message %s", message.id)
                  if (message.created_time > lastMessageTime) {
                    lastMessageTime = message.created_time
                  }
                  next()
                }
              })
            }, nextConversation)
          }, nextPage)
          //TODO if body.paging.next - get next page
        }
      })
    }, function(err) {
      if (err) {
        return callback(err)
      } else {
        debug("updating lastMessageTime for %s to %s", user.id, lastMessageTime)
        user.set('services.facebook.lastMessageTime', lastMessageTime)
        user.save(callback)
      }
    })
  })
}

/**
 * The object for building a link to the object (text and href)
 */
Message.prototype.emailLinkObject = function(opts) {
  return {
    text: this.emailLinkText(),
    href: 'https://facebook.com/' + this.page_id + '/messages/'
  }
}

/**
 * Creates the Message in Elasticsearch
 */
Message.prototype.create = function(callback) {
  keystone.elasticsearch.create({
    index: keystone.get('elasticsearch index'),
    type: this.doc_source,
    id: this.id,
    body: _.omit(this, "id")
  }, callback)
}

module.exports = Message
