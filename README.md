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
```

Notes:
* `TWITTER_API_*` and `FACBOOK_APP_*` must be defined to interact with the services.
* `COOKIE_SECRET` is a default for development only.  Feel free to change as desired.
* `REDIS_URI` is commented out since it is optional.
