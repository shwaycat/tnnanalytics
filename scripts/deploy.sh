#!/bin/bash

function usage () {
  cat <<EOF
Usage: $PROGNAME ENVIRONMENT
Deploys the application to the given ENVIRONMENT
  ENVIRONMENT   dev
EOF
  exit $( [ $# -ne 0 ] && echo $1 || echo 0 )
}

[ -z "$1" ] && usage 1

ENVIRONMENT="$1" && shift 1 && [ "$1" ] && usage 1
APP_NAME="cadence"
[ "$ENVIRONMENT" != "prod" ] && APP_NAME="$APP_NAME-$ENVIRONMENT"
TARGET_HOST="$ENVIRONMENT.cadence.novo.mxmcloud.com"
APP_ROOT="/srv/$APP_NAME"

run() {
  cmd=""
  for arg in "$@" ; do
    cmd="$cmd $arg"
  done
  echo ">$cmd"
  cmd="sh -c 'cd $APP_ROOT ; $cmd'"
  ssh -t "$APP_NAME@$TARGET_HOST" "$cmd"
}

notify_slack() {
  curl -sS --data-binary @- \
      -H 'Content-Type: application/json' \
      -H 'Accept: application/json' \
      -XPOST https://hooks.slack.com/services/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 <<EOJSON
{ "channel": "#team-novo-dev", "text": "$@" }
EOJSON
}

###
# Create release
rel_tag=$( git tag --points-at=HEAD )
[ -z "$rel_tag" ] && rel_tag=$( git rev-parse --short HEAD )
git ls-files -z | xargs -0 tar -czf "tmp/release-$rel_tag.tar.gz"

echo "Release: tmp/release-$rel_tag.gz"

notify_slack "Starting deployment: $rel_tag to $ENVIRONMENT"

###
# Upload release
run mkdir "releases/$rel_tag"
scp "tmp/release-$rel_tag.tar.gz" "$APP_NAME@$TARGET_HOST:$APP_ROOT/releases/$rel_tag/archive.tar.gz"
run tar -C "releases/$rel_tag" -xf "releases/$rel_tag/archive.tar.gz"
run rm "releases/$rel_tag/archive.tar.gz"

###
# Setup links
run rm -R "releases/$rel_tag/log" "releases/$rel_tag/tmp"
run ln -s "$APP_ROOT/shared/node_modules" "releases/$rel_tag/node_modules"
run ln -s "$APP_ROOT/shared/log" "releases/$rel_tag/log"
run ln -s "$APP_ROOT/shared/tmp" "releases/$rel_tag/tmp"
run ln -s "$APP_ROOT/shared/config/.env" "releases/$rel_tag/.env"

###
# NPM install
run "cd releases/$rel_tag ; npm install"

###
# Change current
run rm current
run ln -s "$APP_ROOT/releases/$rel_tag" current

###
# Restart
run sudo /opt/passenger/bin/passenger-config restart-app "$APP_ROOT/current"
run "kill `cat current/tmp/pids/stream-twitter.pid`"
run "nohup node current/scripts/stream-twitter.js &>>current/log/stream-twitter.log & echo \$! >current/tmp/pids/stream-twitter.pid"

notify_slack "Finished deployment: $rel_tag to $ENVIRONMENT"
