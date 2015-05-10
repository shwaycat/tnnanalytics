var _ = require('underscore'),
    debug = require('debug')('cadence:errorHandling'),
    AWS = require('aws-sdk'),
    sns = new AWS.SNS(),
    util = require('util');

function logError(err) {
  if (util.isError(err)) {
    console.error("%s\n%s", err, err.stack);
  } else {
    console.error(err);
  }
}

exports.logError = logError;

exports.sendSNS = function(type, data, callback) {
  var params = {
    // Message - defined below
    MessageAttributes: {
      "default": {
        DataType: 'String',
        StringValue: 'Warning or Error on Candence'
      }
    },
    MessageStructure: 'String',
    Subject: process.env.AWS_SNS_SUBJECT_PREFIX,
    TopicArn: process.env.AWS_SNS_TOPIC_ARN
  };

  if(type == 'warn') {
    params.Subject += ' Warning';
  } else {
    params.Subject += ' Error';
  }

  if(util.isError(data)) {
    params.Message = data.toString() + "\n\n" + data.stack.toString();
  } else {
    params.Message = JSON.stringify(data, null, 1);
  }

  debug("Sending %s notification", type);

  sns.publish(params, function(err) {
    if (err) { // an error occurred
      logError(err);
    } else {
      console.log('Notification published');
    }

    if (_.isFunction(callback)) {
      callback(err);
    }
  });
};
