#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER=deploy
ROOT=/var/www/meditation

mkdir -p "$ROOT"/{releases,media}
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$ROOT"

if [[ ! -e "$ROOT/current" ]]; then
  mkdir -p "$ROOT/releases/bootstrap"
  printf '%s\n' '<!doctype html><meta charset=utf-8><title>aolapp</title>bootstrap ok' \
    > "$ROOT/releases/bootstrap/index.html"
  ln -sfn "$ROOT/releases/bootstrap" "$ROOT/current"
  chown -h "$DEPLOY_USER:$DEPLOY_USER" "$ROOT/current"
fi

install -m 644 /tmp/nginx-aolapp.conf.example /etc/nginx/sites-available/aolapp
ln -sfn /etc/nginx/sites-available/aolapp /etc/nginx/sites-enabled/aolapp
nginx -t
systemctl reload nginx

SUDOERS=/etc/sudoers.d/deploy-nginx
if [[ ! -f "$SUDOERS" ]]; then
  echo "$DEPLOY_USER ALL=(root) NOPASSWD: /bin/systemctl reload nginx, /usr/bin/systemctl reload nginx" > "$SUDOERS"
  chmod 440 "$SUDOERS"
  visudo -cf "$SUDOERS"
fi

echo "ROOT:"
ls -la "$ROOT"
echo "HTTP Host aolapp.ru:"
curl -sI -H 'Host: aolapp.ru' http://127.0.0.1/ | head -20
