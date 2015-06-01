/**
 * @namespace
 * @prop {post} post - Post constructor
 * @prop {comment} comment - Comment constructor
 * @prop {Tag} tag - Tag constructor
 */
module.exports = {
  channel: require('./youtube/channel'),
  video: require('./youtube/video'),
  comment: require('./youtube/comment')
};
