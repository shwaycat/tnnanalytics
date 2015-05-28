/**
 * @namespace
 * @prop {post} post - Post constructor
 * @prop {comment} comment - Comment constructor
 * @prop {Tag} tag - Tag constructor
 */
module.exports = {
  page: require('./googleplus/page'),
  post: require('./googleplus/post'),
  comment: require('./googleplus/comment')
};
