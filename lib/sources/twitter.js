/**
 * @namespace
 * @prop {Tweet} direct_message - Tweet constructor
 * @prop {Mention} mention - Mention constructor
 * @prop {DirectMessage} direct_message - DirectMessage constructor
 */
module.exports = {
  tweet: require('./twitter/tweet'),
  mention: require('./twitter/mention'),
  direct_message: require('./twitter/direct_message'),
  followerCount: require('./twitter/followerCount'),
  reply: require('./twitter/reply')
};
