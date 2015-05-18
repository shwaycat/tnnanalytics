# Cadence

## Variables for .env

```
MONGO_URI=mongodb://localhost:27017/cadence-dev
ELASTICSEARCH_URI=http://localhost:9200
ELASTICSEARCH_INDEX=cadence-dev
# REDIS_URI=redis://localhost:6379/0
COOKIE_SECRET=b8f77nCvM3fSNXACkdrjMXVC5slCAYI2VOdCP5jIaY1v1Ov2k4wjSPmdBQTr23ug
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_CALLBACK_URL=http://cadence.local.mxmcloud.com:3000/auth/twitter?cb
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://cadence.local.mxmcloud.com:3000/auth/facebook?cb
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://cadence.local.mxmcloud.com:3000/auth/google?cb
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SNS_TOPIC_ARN=
AWS_SNS_SUBJECT_PREFIX=[Cadence-Dev]
PDOMAIN=http://cadence.local.mxmcloud.com:3000
```

Notes:
* `TWITTER_API_*` and `FACBOOK_APP_*` must be defined to interact with the services.
* `COOKIE_SECRET` is a default for development only.  Feel free to change as desired.
* `REDIS_URI` is commented out since it is optional.

## Amazon Web Services

Users:

* Development: `novo-cadence-dev` - Access Key ID: `AKIAISHGGE7TMXOHUAXQ`
* Production: `novo-cadence` - Access Key ID: `AKIAITGZ3GOCFBSYLSGQ`

### Amazon SNS Topics

Application errors, warnings, alerts, etc:

* `arn:aws:sns:us-east-1:357664586544:novo-cadence-dev`
* `arn:aws:sns:us-east-1:357664586544:novo-cadence`

AWS SES notifications:

* `arn:aws:sns:us-east-1:357664586544:novo-cadence-email`

### Amazon SES

The domain `cadence.novo.mxmcloud.com` is configured for sending.


### PDOMAIN
This variable should be the hostname of the server you are on and that you want outgoing emails to link back to.
