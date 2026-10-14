#!/usr/bin/env bash
set -euo pipefail
[[ -f /tmp/bootstrap-complete ]] || { echo 'bootstrap incomplete' >&2; exit 1; }
exec timeout --signal=TERM --kill-after=1 12s mongosh --nodb --quiet --file /opt/synkro/health.js
