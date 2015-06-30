var util = require('util'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    async = require('async'),
    moment = require('moment'),
    _ = require('underscore'),
    d = moment.duration;

function timestamp() {
  return (new Date()).toISOString();
}

var childProcesses = [],
    queue = async.priorityQueue(function queueWorker(task, callback) {
      var taskName = util.format("%s %j", task.cmd, task.args);

      console.log('%s Running: %s', timestamp(), taskName);

      var cp = spawn(task.cmd, task.args || [], { stdio: 'inherit' }),
          cpTimeout = setTimeout(function() {
            console.error("%s Timeout for: %s", timestamp(), taskName);
            cp.kill('SIGTERM');
          }, 5*60*1000);

      childProcesses[cp.pid] = cp;

      cp.on('error', function(err) {
        clearTimeout(cpTimeout);
        delete childProcesses[cp.pid];
        console.error("%s Error for: %s\n    %s\n%s", timestamp(), taskName, err, err.stack);
        callback();
      });

      cp.on('exit', function(code, signal) {
        clearTimeout(cpTimeout);
        delete childProcesses[cp.pid];
        if (code) {
          console.info("%s Exited %s: %s", timestamp(), code, taskName);
        } else if (signal) {
          console.warn("%s Killed %s: %s", timestamp(), signal, taskName);
        }
        callback();
      });
    }, 1);

queue.drain = function queueDrained() {
  console.log('%s All items have been processed', timestamp());
};

function schedule(duration, priority, cmd, args) {
  if ('function' == typeof priority) {
    setInterval(priority, duration.asMilliseconds());
  } else {
    setInterval(function() {
      queue.push({ cmd: cmd, args: args }, priority);
    }, duration.asMilliseconds());
  }
}

schedule(d(3, 'm'), 10, 'node', [ 'scripts/oauth-refresh.js' ]);

schedule(d(3, 'm'), 60, 'node', [ 'scripts/notify.js' ]);

var twitterCount = 0;
schedule(d(13, 'm'), function() {
  if (++twitterCount == 18) {
    twitterCount = 0;
    queue.push({ cmd: 'node', args: [ 'scripts/pull-twitter.js', '--all' ] }, 40);
  } else {
    queue.push({ cmd: 'node', args: [ 'scripts/pull-twitter.js' ] }, 50);
  }
});

schedule(d(17, 'm'), 50, 'node', [ 'scripts/pull-facebook.js' ]);

schedule(d(23, 'm'), 50, 'node', [ 'scripts/pull-youtube.js' ]);

var instagramCount = 0;
schedule(d(31, 'm'), function() {
  if (++instagramCount == 7) {
    instagramCount = 0;
    queue.push({ cmd: 'node', args: [ 'scripts/pull-instagram.js', '--all' ] }, 40);
  } else {
    queue.push({ cmd: 'node', args: [ 'scripts/pull-instagram.js' ] }, 50);
  }
});

schedule(d(113, 'm'), 50, 'node', [ 'scripts/pull-googleplus.js' ]);

schedule(d(6, 'h'), 50, 'node', [ 'scripts/pull-google-analytics.js' ]);

fs.writeFileSync('tmp/pids/scheduler.pid', process.pid.toString());

console.log("%s Started", timestamp());

_.each(['SIGINT', 'SIGTERM', 'SIGHUP'], function(signal) {
  process.on(signal, function() {
    console.log("%s Terminating %s child processes...", timestamp(), _.keys(childProcesses).length);

    _.each(childProcesses, function(cp) {
      cp.kill(signal);
    });

    var endTime = new Date((new Date()).valueOf() + 10*1000);

    async.until(
      function() {
        return new Date() >= endTime || _.isEmpty(childProcesses);
      },
      function(cb) {
        setTimeout(cb, 500);
      },
      function(err) {
        if (err) console.error(err);
      }
    );

    process.exit(0);
  });
});

process.on('exit', function(code) {
  console.log("%s Exiting code %s", timestamp(), code);

  if (!_.isEmpty(childProcesses)) {
    console.log("%s Terminating %s child remaining processes forcefully...", timestamp(),
      _.keys(childProcesses).length);
    _.each(childProcesses, function(cp) {
      cp.kill('SIGKILL');
    });
  }

  fs.unlinkSync('tmp/pids/scheduler.pid');
});
