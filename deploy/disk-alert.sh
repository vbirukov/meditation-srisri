#!/usr/bin/env bash
# Алерт: мало места на диске. Ставить на хост рядом с aolapp.
# Пример: /etc/cron.daily/aolapp-disk-alert  или systemd timer.
set -euo pipefail

THRESHOLD_PCT="${DISK_ALERT_THRESHOLD:-15}"
MOUNT="${DISK_ALERT_MOUNT:-/}"
HOST="$(hostname -s 2>/dev/null || echo host)"

avail_pct="$(df -P "$MOUNT" | awk 'NR==2 { gsub(/%/,"",$5); print 100-$5 }')"
used_pct="$(df -P "$MOUNT" | awk 'NR==2 { gsub(/%/,"",$5); print $5 }')"
human="$(df -hP "$MOUNT" | awk 'NR==2 { print $4 " free of " $2 }')"

if [[ "$avail_pct" -lt "$THRESHOLD_PCT" ]]; then
  msg="[aolapp disk-alert] $HOST:$MOUNT only ${avail_pct}% free ($human, used ${used_pct}%) — threshold ${THRESHOLD_PCT}%"
  logger -t aolapp-disk-alert -p user.warning "$msg"
  echo "$msg" >&2
  exit 1
fi

logger -t aolapp-disk-alert -p user.info "[aolapp disk-alert] $HOST:$MOUNT ok: ${avail_pct}% free ($human)"
exit 0
