var path = require('path'),
    exec = require('child_process').exec,
    fs = require('fs'),
    tar = require('tar-fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    gzip = require('gulp-gzip'),
    jshint = require('gulp-jshint'),
    jshintReporter = require('jshint-stylish'),
    watch = require('gulp-watch');

if (gutil.env.environment != 'dev' && gutil.env.environment != 'prod') {
  throw new Error("Invalid environment");
}

var APP_NAME = 'cadence' + (gutil.env.environment == 'dev' ? '-dev' : ''),
    HOST = gutil.env.environment + '.tnnanalytics.net',
    APP_ROOT = '/srv/' + APP_NAME,
    HOMEDIR = process.env.HOME || process.env.USERPROFILE,
    lsData, sha, tarball, archive;

var gulpSSH = require('gulp-ssh')({
      sshConfig: {
        host: HOST,
        username: APP_NAME,
        agent: process.env.SSH_AUTH_SOCK,
        privateKey: fs.readFileSync(path.join(HOMEDIR, '.ssh', 'id_rsa'))
      }
    });

// gulp lint
gulp.task('lint', function() {
  gulp.src(['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json'])
    .pipe(jshint())
    .pipe(jshint.reporter(jshintReporter));
});

// gulp watcher for lint
gulp.task('watch:lint', function () {
  gulp.src(['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json'])
    .pipe(watch())
    .pipe(jshint())
    .pipe(jshint.reporter(jshintReporter));
});

// Deployment: list files
gulp.task('list-data', function(callback) {
  exec('git ls-files -z', function(err, data) {
    if (err) return callback(err);
    lsData = data.replace(/\0$/, '').split("\0");
    callback();
  });
});

// Deployment: generate tarball from file list
gulp.task('tarball', ['list-data'], function(callback) {
  exec('git rev-parse --short HEAD', function(err, data) {
    sha = data.trim();
    tarball = 'release-' + sha + '.tar';
    archive = tarball + '.gz';

    var writer = fs.createWriteStream(path.join('.', 'tmp', tarball));
    tar.pack('./', { entries: lsData }).pipe(writer);
    writer.on('finish', callback);
  });
});

// Deployment: gzip the archive tarball
gulp.task('gzip', ['tarball'], function() {
  return gulp.src(path.join('.', 'tmp', tarball))
    .pipe(gzip())
    .pipe(gulp.dest(path.join('.', 'tmp')));
});

function relPath(path) {
  if (path) {
    return '"releases/' + sha + '/' + path + '"';
  } else {
    return '"releases/' + sha + '"';
  }
}

// Deployment: make release directory
gulp.task('mkdir', ['gzip'], function() {
  return gulpSSH.exec(['mkdir ' + relPath()]);
});

// Deployment: upload release archive
gulp.task('upload', ['mkdir'], function() {
  return gulp.src(path.join('.', 'tmp', archive))
    .pipe(gulpSSH.sftp('write', 'releases/' + sha + '/archive.tar.gz'));
});

// Deployment: decompress release archive
gulp.task('decompress', ['upload'], function() {
  return gulpSSH.exec(['tar -C ' + relPath() + ' -xf ' + relPath('archive.tar.gz')]);
});

// Deployment: remove uploaded release archive
gulp.task('cleanup', ['decompress'], function() {
  return gulpSSH.exec(['rm ' + relPath('archive.tar.gz')]);
});

// Deployment: link directories & files
gulp.task('setup-links', ['cleanup'], function() {
  return gulpSSH.exec([
    'rm -Rf ' + [ relPath('log'), relPath('tmp') ].join(" "),
    'ln -s "' + APP_ROOT + '/shared/node_modules" ' + relPath('node_modules'),
    'ln -s "' + APP_ROOT + '/shared/log" ' + relPath('log'),
    'ln -s "' + APP_ROOT + '/shared/tmp" ' + relPath('tmp'),
    'ln -s "' + APP_ROOT + '/shared/config/.env" ' + relPath('.env')
  ]);
});

// Deployment: run npm install
gulp.task('npm-install', ['setup-links'], function() {
  return gulpSSH.shell([ 'cd ' + relPath(), 'npm install' ]);
});

// Deployment: change current release
gulp.task('change-current', ['npm-install'], function() {
  return gulpSSH.exec([
    'rm current',
    'ln -s "' + APP_ROOT + '/releases/' + sha + '" current'
  ]);
});

// Deployment: restart passenger
gulp.task('restart', ['change-current'], function() {
  return gulpSSH.shell([
      'kill `cat shared/tmp/pids/scheduler.pid`',
      'sudo /opt/passenger/bin/passenger-config restart-app "' + APP_ROOT + '/current"',
      'sleep 2',
      'cd current',
      'nohup node scheduler.js &>>log/scheduler.log </dev/null &'
    ],{
      pty: true
    });
});

// Deployment
gulp.task('deploy', ['restart']);
