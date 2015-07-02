var path = require('path'),
    exec = require('child_process').exec,
    fs = require('fs'),
    tar = require('tar-fs'),
    async = require('async'),
    Client = require('ssh2').Client,
    zlib = require('zlib');

var ptyopts = { pty: true },
    lsData, sha, tarball, archive, envs, currentRelease;

function relPath(path) {
  if (path) {
    return '"releases/' + sha + '/' + path + '"';
  } else {
    return '"releases/' + sha + '"';
  }
}

function compress(callback) {
  async.series([
    function(next) {
      exec('git rev-parse --short HEAD', function(err, data) {
        sha = data.trim();
        console.log('Tar %s files [%s]', lsData.length, sha);
        tarball = 'release-' + sha + '.tar';
        archive = tarball + '.gz';

        var writer = fs.createWriteStream(path.join('.', 'tmp', tarball));
        tar.pack('./', { entries: lsData }).pipe(writer);

        writer.on('finish', next);
      });
    },
    function(next) {
      var raw = fs.createReadStream(path.join('.', 'tmp', tarball));
      var writer = fs.createWriteStream(path.join('.', 'tmp', archive));

      raw.pipe(zlib.createGzip()).pipe(writer);

      writer.on('finish', function(){
        fs.unlink(path.join('.','tmp', tarball));
        next();
      });
    }
  ], callback);
}

function ship(callback) {
  var conn = new Client();

  function sshExec(cmd, opts, cb) {
    if(typeof(opts) == 'function') {
      cb = opts;
      opts = {};
    }
    conn.exec(cmd, opts, function(err, stream) {
      if (err) return cb(err);

      stream.on('data', function(data) {
        process.stdout.write('STDOUT: ' + data + '\n');
      });

      stream.stderr.on('data', function(data) {
        process.stdout.write('STDERR: ' + data + '\n');
      });

      stream.on('close', function(code, signal) {
        if(code !== 0) {
          return cb(new Error('Exited with code ' + code + (signal ? ' with signal ' + signal : '')));
        }
        cb();
      });

    });
  }

  function rollback(cb) {
    async.auto({
      link: async.apply(sshExec, 'ln -s "' + envs.approot + '/releases' + currentRelease + '" current'),
      killScheduler: [ 'link' , async.apply(sshExec, 'kill `cat shared/tmp/pids/scheduler.pid`')],
      restart: [ 'link', async.apply(sshExec, 'sudo /opt/passenger/bin/passenger-config restart-app "' + envs.approot + '/current"', ptyopts)],
      sleep: [ 'killScheduler', async.apply(sshExec, 'sleep 2') ],
      startScheduler: [ 'sleep', async.apply(sshExec, 'cd current;nohup node scheduler.js &>>log/scheduler.log </dev/null &') ]
    }, function(err) {
      conn.end();
      cb(err);
    });
  }

  function getCurrentRelease(cb) {
    currentRelease = '';
    conn.exec('ls -ld current', function(err, stream) {
      stream.on('data', function(data) {
        currentRelease = data.toString().match(/\/[^\/]+$/)[0];
        cb();
      });
    });
  }

  conn.on('ready', function() {
    console.log('Client :: ready');

    async.series([
      async.apply(sshExec, 'mkdir ' + relPath()),

      function(next) { // sftp archive up to server
        conn.sftp(function(err, sftp) {
          if (err) throw err;
            sftp.fastPut(path.join('.', 'tmp', archive), 'releases/' + sha + '/archive.tar.gz', function(err) {
              if (err) console.log(err);

              next();
            });
        });
      },
      getCurrentRelease,
      async.apply(sshExec, 'tar -C ' + relPath() + ' -xf ' + relPath('archive.tar.gz')),
      async.apply(sshExec, 'rm ' + relPath('archive.tar.gz')),
      async.apply(sshExec, 'rm -Rf ' + [ relPath('log'), relPath('tmp') ].join(" ")),

      async.apply(sshExec, 'ln -s "' + envs.approot + '/shared/node_modules" ' + relPath('node_modules')),
      async.apply(sshExec, 'ln -s "' + envs.approot + '/shared/log" ' + relPath('log')),
      async.apply(sshExec, 'ln -s "' + envs.approot + '/shared/tmp" ' + relPath('tmp')),
      async.apply(sshExec, 'ln -s "' + envs.approot + '/shared/config/.env" ' + relPath('.env')),

      async.apply(sshExec, 'cd ' + relPath() + ';' + 'npm install'),
      async.apply(sshExec, 'rm current'),
      async.apply(sshExec, 'ln -s "' + envs.approot + '/releases/' + sha + '" current'),

      async.apply(sshExec, 'kill `cat shared/tmp/pids/scheduler.pid`'),
      async.apply(sshExec, 'sudo /opt/passenger/bin/passenger-config restart-app "' + envs.approot + '/current"', ptyopts),
      async.apply(sshExec, 'sleep 2'),
      async.apply(sshExec, 'cd current;nohup node scheduler.js &>>log/scheduler.log </dev/null &')



    ],function(err) {
      if(err) return rollback(callback);
      conn.end();
      console.log('Client :: closed');
      callback();
    });

  }).connect({
    host: envs.host,
    port: 22,
    username: envs.appname,
    agent: process.env.SSH_AUTH_SOCK
  });
}

function list(callback) {
  exec('git ls-files -z', function(err, data) {
    if (err) return callback(err);
    lsData = data.replace(/\0$/, '').split("\0");
    callback();
  });
}

module.exports = function(envsIn, callback) {
  envs = envsIn;
  async.auto({
    list: list,
    compress:['list', compress],
    ship: ['compress', ship]
  }, callback);
};
