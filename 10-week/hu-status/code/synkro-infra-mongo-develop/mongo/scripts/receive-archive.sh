#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ ${1:-} =~ ^/tmp/synkro-[a-f0-9-]+\.archive\.gz$ ]] || { echo 'invalid temporary archive path' >&2; exit 2; }
cat > "$1"
