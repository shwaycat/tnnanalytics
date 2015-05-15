/**
 * @namespace
 * @prop {post} post - Post constructor
 * @prop {comment} comment - Comment constructor
 * @prop {Tag} tag - Tag constructor
 */
module.exports = {
  media: require('./instagram/media'),
  followerCount: require('./instagram/followerCount')
};

// MEDIA -> Likes, Comments, Likes = Delta
// COMMENTS -> Gather Text for AE count of Comments = engagement
// TAGS -> Users in Photo, Caption for AE, Count of TAGS = engagement, TOP COUNTRIES
// Followers -> ACQ
// NO IMPRESSION


// @username
// MY MEDIA -> location = where I was COMMENT no country
// TAG MEDIA -> location = where They were (TOP COUNTRIES)
