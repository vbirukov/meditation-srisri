#!/usr/bin/env bash
# Запускать от root/opora на 109.73.201.170
set -euo pipefail

DEPLOY_USER=deploy
ROOT=/var/www/meditation

mkdir -p "$ROOT"/{releases,media,data,notifier}
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$ROOT"

# placeholder, пока нет первого деплоя
if [[ ! -e "$ROOT/current" ]]; then
  mkdir -p "$ROOT/releases/bootstrap"
  echo '<!doctype html><title>aolapp</title>ok' > "$ROOT/releases/bootstrap/index.html"
  ln -sfn "$ROOT/releases/bootstrap" "$ROOT/current"
  chown -h "$DEPLOY_USER:$DEPLOY_USER" "$ROOT/current"
fi

CONF_SRC="$(dirname "$0")/nginx-aolapp.conf.example"
if [[ -f "$CONF_SRC" ]]; then
  install -m 644 "$CONF_SRC" /etc/nginx/sites-available/aolapp
else
  echo "Скопируй nginx-aolapp.conf.example → /etc/nginx/sites-available/aolapp вручную"
fi

ln -sfn /etc/nginx/sites-available/aolapp /etc/nginx/sites-enabled/aolapp
nginx -t
systemctl reload nginx

echo "HTTP готов. После DNS vk.aolapp.ru:"
echo "  certbot --nginx -d aolapp.ru -d www.aolapp.ru -d vk.aolapp.ru"

# reload nginx без пароля для CI
SUDOERS=/etc/sudoers.d/deploy-nginx
if [[ ! -f "$SUDOERS" ]]; then
  echo "$DEPLOY_USER ALL=(root) NOPASSWD: /bin/systemctl reload nginx, /usr/bin/systemctl reload nginx" > "$SUDOERS"
  chmod 440 "$SUDOERS"
  visudo -cf "$SUDOERS"
  echo "sudoers: $SUDOERS"
fi
