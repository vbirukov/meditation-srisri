# VK notifier (этап 2.2)

Один Node-скрипт на хосте `109.73.201.170`. Без ORM / auth / REST-API.

| Режим | Что делает |
|--------|------------|
| `serve` | localhost ingest `POST /register` → upsert в JSONL |
| `send` | cron: кому пора — `notifications.sendMessage` |
| `self-check` | assert upsert + due-filter |

## Данные

`/var/www/meditation/data/reminders.jsonl` — одна строка на `vk_user_id`:

```json
{"vk_user_id":1,"enabled":true,"prefer_hour":7,"prefer_minute":0,"last_session_at":"...","last_sent_at":null,"updated_at":"..."}
```

Слот из онбординга / End → `prefer_hour` + `prefer_minute` (МСК). Пресеты: morning 6–9 / day 12–15 / evening 19–22, плюс `<input type="time">`.

Не шлём, если сегодня уже была сессия или уже слали. Окно отправки — 15 минут от выбранного времени (`*:0/15` timer).

## Env

`/var/www/meditation/notifier/.env`:

```
VK_SERVICE_TOKEN=...   # сервисный ключ мини-приложения
VK_APP_SECRET=...      # секрет для проверки sign launch-params
NOTIFIER_DATA=/var/www/meditation/data/reminders.jsonl
NOTIFIER_PORT=8791
```

## Установка на сервере

```bash
sudo mkdir -p /var/www/meditation/{notifier,data}
sudo chown deploy:deploy /var/www/meditation/{notifier,data}

# после деплоя кода (или вручную):
rsync -a scripts/notifier/ deploy@host:/var/www/meditation/notifier/

# systemd (от root)
sudo cp deploy/notifier.service /etc/systemd/system/
sudo cp deploy/notifier-send.service /etc/systemd/system/
sudo cp deploy/notifier-send.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now notifier.service
sudo systemctl enable --now notifier-send.timer
```

Nginx (см. `deploy/nginx-aolapp.conf.example`):

```
location = /notify-register {
  proxy_pass http://127.0.0.1:8791/register;
  ...
}
```

## Клиент

После allow notifications и на EndScreen (если already allowed) → `POST /notify-register` с `launch` query для HMAC-подписи.
