var gulp = require('gulp'),
    gutil = require('gulp-util'),
    deploy = require('./deploy'),
    envs = require('./deploy.json');
// Deployment

gulp.task('deploy', function(cb) {
  if (gutil.env.environment != 'dev' && gutil.env.environment != 'prod') {
    throw new Error("Invalid environment");
  } else {
    deploy(envs[gutil.env.environment], cb);
  }
});
