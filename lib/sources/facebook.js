/**
 * @namespace
 * @prop {Message} message - Message constructor
 * @prop {Post} post - Post constructor
 * @prop {Comment} comment - Comment constructor
 */
module.exports = {
  comment: require('./facebook/comment'),
  mention: require('./facebook/mention'),
  message: require('./facebook/message'),
  page: require('./facebook/page'),
  post: require('./facebook/post'),
  status: require('./facebook/status')
};
