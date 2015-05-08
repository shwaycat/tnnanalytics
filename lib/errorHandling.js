var _ = require('underscore'),
    async = require('async'),
    debug = require('debug')('cadence:errorHandling'),
    AWS = require('aws-sdk'),
    sns = new AWS.SNS(),
    util = require('util');

exports.sendSNS = function(type, data, stack, callback) {
  
  var subject = ' '
  if(type == 'warn') {
    subject += 'Warning'
  } else {
    subject += 'Error';
  }

  if (!_.isFunction(callback)) {
    callback = function(err) {
      console.error(err);
    }
  }

  var message = '';

  if(util.isError(data)) {
    message += data.toString();
    message += "\n\n\n";
    message += stack.toString();
  } else {
    message += JSON.stringify(data);
  }

  var params = {
    Message: message,
    MessageAttributes: {
      default: {
        DataType: 'String',
        StringValue: 'Warning or Error on Candence'
      },
    },
    MessageStructure: 'String',
    Subject: process.env.AWS_SNS_SUBJECT_PREFIX + subject,
    TopicArn: process.env.AWS_SNS_TOPIC_ARN
  };

  sns.publish(params, function(err, data) {
    if (err) return callback(err, err.stack); // an error occurred
    console.log('Notification Sent Out')
    callback();
  });
};

