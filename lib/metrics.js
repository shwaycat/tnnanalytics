module.exports = {
  dashboard_v1: require('./metrics/dashboard').v1,
  dashboard_v2: require('./metrics/dashboard').v2,
  facebook: require('./metrics/facebook'),
  googleanalytics: require('./metrics/googleanalytics'),
  googleplus: require('./metrics/googleplus'),
  instagram: require('./metrics/instagram'),
  twitter: require('./metrics/twitter'),
  youtube: require('./metrics/youtube')
};
