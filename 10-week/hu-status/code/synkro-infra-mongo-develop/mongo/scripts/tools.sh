#!/usr/bin/env bash
set -euo pipefail
umask 077
MONGO_TOOLS_CONFIG=$(mktemp /tmp/mongo-tools.XXXXXX)
export MONGO_TOOLS_CONFIG
trap 'rm -f "$MONGO_TOOLS_CONFIG"' EXIT
mongosh --nodb --quiet --file /opt/synkro/tools-config.js > /dev/null
case "${1:-}" in
  backup) timeout --signal=TERM --kill-after=2 120s mongodump --config "$MONGO_TOOLS_CONFIG" \
    --db "$MONGO_TOOLS_DB" --archive="$MONGO_TOOLS_ARCHIVE" --gzip ;;
  restore) timeout --signal=TERM --kill-after=2 120s mongorestore --config "$MONGO_TOOLS_CONFIG" \
    --archive="$MONGO_TOOLS_ARCHIVE" --gzip --nsInclude "$MONGO_TOOLS_DB.*" --stopOnError ;;
  restore-sales) timeout --signal=TERM --kill-after=2 120s mongorestore --config "$MONGO_TOOLS_CONFIG" \
    --archive="$MONGO_TOOLS_ARCHIVE" --gzip --nsInclude 'sales.sale' --noIndexRestore --noOptionsRestore --stopOnError ;;
  *) echo 'expected backup or restore' >&2; exit 2 ;;
esac
