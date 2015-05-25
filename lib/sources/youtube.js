/**
 * @namespace
 * @prop {post} post - Post constructor
 * @prop {comment} comment - Comment constructor
 * @prop {Tag} tag - Tag constructor
 */
module.exports = {
  subscriberCount: require('./youtube/subscriberCount'),
  video: require('./youtube/video'),
  comment: require('./youtube/comment')
};

/*
  youtube.channels.list - Get list of all youtube channels for a user
  GET https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=maxmedia&key={YOUR_API_KEY}
     part = contentDetails
     forUsername
       Brings back an array of "items" 
       Channel ID needs to be selected by user.

UCtDFpIc2MoOgwygAvgy7fUw = NOVO
UCKRNfvuKDTqN5qreqabaERw = DOM

*/