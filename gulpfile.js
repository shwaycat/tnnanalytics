var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    jshintReporter = require('jshint-stylish'),
    watch = require('gulp-watch'),
    jsdoc = require('gulp-jsdoc'),
    _ = require('underscore');

/*
 * Create variables for our project paths so we can change in one place
 */
var paths = {
  'src':['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json']
};

// gulp lint
gulp.task('lint', function() {
  gulp.src(paths.src)
    .pipe(jshint())
    .pipe(jshint.reporter(jshintReporter));
});

// gulp watcher for lint
gulp.task('watch:lint', function () {
  gulp.src(paths.src)
    .pipe(watch())
    .pipe(jshint())
    .pipe(jshint.reporter(jshintReporter));
});

// gulp jsdoc
gulp.task('doc', function() {
  var docPaths = _.collect(['lib', 'models', 'routes', 'scripts', 'updates'], function(dir) {
    return './'+dir+'/**/*.js';
  });
  gulp.src(docPaths).pipe(jsdoc('./doc'));
});
