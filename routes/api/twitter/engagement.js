var keystone = require('keystone'),
    _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('api.engagement');


exports = module.exports = function(req, res) {
 
  var view = new keystone.View(req, res),
      locals = res.locals,
      dataReturn = [];

  startTime = new Date("Mar 1, 2015");
  endTime = new Date("Mar 31, 2015");
  if(req.query.startTime) {
    startTime = new Date(req.query.startTime);
  }
  if(req.query.endTime) {
    endTime = new Date(req.query.endTime);
  }
  
  var dataReturn = [];
  var timeHolder = startTime;
  while(timeHolder < endTime) {
    timeHolder.setHours(timeHolder.getHours() + 1);
    dataReturn.push( { 
      "key": timeHolder.toJSON(),
      "value": Math.floor(Math.random() * 10)
    });
  }

  var randomPercents = [];
  var randomNumbers = [];
  for(i=0; i<5; i++) {
    randomNumbers.push(Math.floor(Math.random() * 10));
  }
  var randomTotal = _.reduce(randomNumbers, function(memo, num){ return memo + num; }, 0)


  for(i=0; i<randomNumbers.length; i++) {
    randomPercents.push(randomNumbers[i] / randomTotal);
  }
  

  // Build Response Here
  // DATA = Array of Key (Date) value pairs.
  
  // Return the response
  view.render(function(err) {
    if (err) return res.apiError('error', err);

    return res.apiResponse({
      success: true,
      type: 'engagement',
      source: 'twitter',
      queryString: req.query,
      data: dataReturn,
      summary: {
        "totalFavorites" : Math.round(_.reduce(dataReturn, function(memo, cur){ return memo + cur.value; }, 0) * (randomPercents[0])),
        "totalRetweets" : Math.round(_.reduce(dataReturn, function(memo, cur){ return memo + cur.value; }, 0) * (randomPercents[1])),
        "totalMentions" : Math.round(_.reduce(dataReturn, function(memo, cur){ return memo + cur.value; }, 0) * (randomPercents[2])),
        "totalReplies" : Math.round(_.reduce(dataReturn, function(memo, cur){ return memo + cur.value; }, 0) * (randomPercents[3])),
        "totalDirectMentions" : Math.round(_.reduce(dataReturn, function(memo, cur){ return memo + cur.value; }, 0) * (randomPercents[4]))
      }
    });

  });

}
