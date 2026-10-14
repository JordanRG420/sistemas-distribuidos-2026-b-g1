#!/usr/bin/env bash
set -euo pipefail
if ! timeout --signal=TERM --kill-after=2 "${MONGO_STARTUP_TIMEOUT_SECONDS}s" \
  mongosh --nodb --quiet --file /opt/synkro/bootstrap.js; then
  echo 'bootstrap failed or exceeded MONGO_STARTUP_TIMEOUT_SECONDS; verify credentials and replica configuration' >&2
  exit 1
fi
