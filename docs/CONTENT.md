# Как пополнять контент

Нужен **ffmpeg** в PATH (`winget install Gyan.FFmpeg`).

## 1. Guided-медитация (основной путь)

Из корня репо:

```bash
# аудио → public/media/audio/<id>.mp3 + запись в meditations.json + манифесты
npm run add-practice -- --type audio --file "C:\path\to\source.mp3" --id om-evening --title "Вечерний Ом" --lang ru --offline --desc "Короткая практика"

# видео → originals + .480p/.720p + base .mp4 + JSON + манифесты
npm run add-practice -- --type video --file "C:\path\to\source.mp4" --id breath-spine --title "Дыхание вдоль позвоночника" --lang ru
```

| Флаг | Зачем |
|------|--------|
| `--id` | ascii-slug (`a-z0-9-`), уникальный |
| `--lang` | `ru` \| `en` \| `hi` \| `multi` (язык **контента**, не UI) |
| `--offline` | только audio: в дефолтный офлайн-пакет |
| `--scene` | `ganga` \| `sea` (фон для audio) |
| `--dry` | план без записи |
| `--force` | перезаписать существующий id |

Что делает скрипт:

1. копирует исходник в `media-originals/`
2. жмёт в `public/media/` (audio 96k mono; video 480p+720p)
3. пишет/обновляет `src/data/meditations.json`
4. гоняет `media:manifest` + `offline:manifest`

Проверка без файлов: `npm run check:add-practice`.

После добавления: `git add` JSON + `public/media/...` (не коммить сырые гигабайты из `media-originals/` без нужды) → push → CI задеплоит. **Видео** на сервер CI не заливает (`rsync` exclude `video/`) — их нужно один раз положить на хост в `/var/www/meditation/media/video/`.

## 2. Садхана / блоки

Пока вручную: `src/data/sadhana.json` (`practices` + `blocks`), аудио блоков уже в `public/media/audio/`. Потом `npm run offline:manifest`.

## 3. Практика недели / «Новое»

Правь `src/data/featured.json`:

- `rotationMeditationIds` / `rotationSadhanaIds` — ротация по ISO-неделе
- `newMeditationIds` — секция «Новое» на хабе

## 4. Офлайн-видео (опционально)

По умолчанию в пакет только audio с `isOfflinePrecached`.  
Чтобы добавить видео (~30–60 MB за ролик 480p), допиши id в `src/data/offline-curation.json` → `videoMeditationIds`.

## 5. Резюме Гуруджи

Ключи в `src/data/guruji-content.json` (`byMeditationId` / `bySadhanaId`) должны совпадать с id практик. В DEV при fallback будет `console.warn`.

## 6. Права

См. `docs/CONTENT_RIGHTS.md`.
