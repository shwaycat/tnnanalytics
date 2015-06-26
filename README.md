# Cadence

## Variables for .env

```
MONGO_URI=mongodb://localhost:27017/cadence-dev
ELASTICSEARCH_URI=http://localhost:9200
ELASTICSEARCH_INDEX=cadence-dev
# REDIS_URI=redis://localhost:6379/0
COOKIE_SECRET=b8f77nCvM3fSNXACkdrjMXVC5slCAYI2VOdCP5jIaY1v1Ov2k4wjSPmdBQTr23ug
PDOMAIN=http://cadence.local.tnnanalytics.net:3000
EMAIL_FROM=no-reply@tnnanalytics.net

TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_CALLBACK_URL=http://cadence.local.tnnanalytics.net:3000/auth/twitter?cb

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://cadence.local.tnnanalytics.net:3000/auth/facebook?cb

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_CALLBACK_URL=http://cadence.local.tnnanalytics.net:3000/auth/instagram?cb

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://cadence.local.tnnanalytics.net:3000/auth/google?cb
GOOGLEPLUS_CALLBACK_URL=http://cadence.local.tnnanalytics.net:3000/auth/googleplus?cb

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
# don't use AWS_SNS_TOPIC_ARN for local development
# AWS_SNS_TOPIC_ARN=
AWS_SNS_SUBJECT_PREFIX=[Cadence-Dev]
```

Notes:
* `*_SECRET` variables must be defined to interact with the services.
* `COOKIE_SECRET` is a default for development only.  Feel free to change as desired.
* `REDIS_URI` is commented out since it is optional.

### Amazon SNS Topics

Application errors, warnings, alerts, etc:

* `arn:aws:sns:us-east-1:616907631832:tnnanalytics-dev`
* `arn:aws:sns:us-east-1:616907631832:tnnanalytics-prod`

AWS SES notifications:

* `arn:aws:sns:us-east-1:616907631832:tnnanalytics-email`

### Amazon SES

The domain `tnnanalytics.net` is configured for sending.

### PDOMAIN

This variable should be the hostname of the server you are on and that you want outgoing emails to link back to.
