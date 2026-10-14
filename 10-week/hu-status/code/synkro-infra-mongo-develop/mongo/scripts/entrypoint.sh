#!/usr/bin/env bash
# Deliberately avoids the official image's temporary unauthenticated init server.
set -euo pipefail
umask 077
rm -f /tmp/bootstrap-complete
mkdir -p /data/db /data/configdb
chown mongodb:mongodb /data/db /data/configdb
key=/data/db/.replica-key
if [[ -e "$key" ]]; then
  if ! cmp -s "$key" /run/secrets/mongo-internal-key; then
    echo 'MONGO_INTERNAL_KEY mismatch; restore the original secret, no key replacement performed' >&2
    exit 1
  fi
else
  if [[ -e /data/db/WiredTiger || -e /data/db/storage.bson ]]; then
    echo 'persistent database has no internal key; explicit recovery is required' >&2
    exit 1
  fi
  install -o mongodb -g mongodb -m 400 /run/secrets/mongo-internal-key "$key"
fi
chown mongodb:mongodb "$key"
chmod 400 "$key"
gosu mongodb mongod --replSet "$MONGO_REPLICA_SET" --bind_ip_all --auth --keyFile "$key" &
mongo_pid=$!
shutdown() {
  kill -TERM "$mongo_pid" 2>/dev/null || true
  wait "$mongo_pid" || true
}
trap shutdown EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
if ! bash /opt/synkro/bootstrap.sh; then
  echo 'MongoDB initialization failed; startup is not healthy' >&2
  exit 1
fi
touch /tmp/bootstrap-complete
wait "$mongo_pid"
