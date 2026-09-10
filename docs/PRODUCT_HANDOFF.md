# Meditate with Sri Sri — документ для анализа и развития

**Версия документа:** 1.0  
**Дата:** 2026-09-10  
**Репозиторий:** `meditation-srisri` (`meditate-with-sri-sri` @ 0.1.0)  
**Назначение:** передача продукта на продуктовый / технический анализ, приоритизацию roadmap и оценку следующих инвестиций.

---

## 1. Резюме для читателя

**Meditate with Sri Sri** — клиентское SPA/PWA для спокойной guided-медитации и многоэтапной садханы. Приложение живёт в двух каналах:

| Канал | URL | Роль |
|-------|-----|------|
| Браузер / PWA | `https://aolapp.ru` (+ `www`) | полный PWA: service worker, install prompt, offline-пакет |
| VK Mini App | `https://vk.aolapp.ru` → `https://vk.com/app7595020` | тот же билд в iframe/WebView VK + Bridge (шеринг, Storage, избранное, инвайты) |

**Ключевой принцип продукта:** минимум кликов до практики, мягкий линейный флоу, визуальный акцент на атмосфере (видео/текстуры), а не на «дашборде функций».

**Архитектурный факт:** бэкенда и собственной БД **нет**. Контент — статический JSON + медиафайлы. Прогресс и предпочтения — в `localStorage` / IndexedDB; во VK дополнительно синхронизируются агрегаты через VK Cloud Storage.

---

## 2. Продуктовый контекст

### 2.1. Цели

1. Дать быстрый путь к практике (приветствие → выбор → сессия → завершение).
2. Поддержать два типа контента: **guided** (аудио/видео) и **структурированная садхана** (фазы + блоки).
3. Дать «свою практику»: конструктор из блоков каталога + загрузка своего аудио.
4. Работать офлайн (хотя бы базовый аудио-пакет) в PWA-канале.
5. Распространяться через VK Mini Apps без отдельного нативного клиента.

### 2.2. Аудитория (из продуктового ТЗ / `structure.md`)

- Интерес к медитации и/или Шри Шри Рави Шанкару.
- Возраст ориентировочно 20–60.
- Primary device: смартфон; secondary: десктоп.
- Ожидание: простой, неагрессивный UX, без перегруза настройками.

### 2.3. Правовой контур

Использование имени, образа и официальных материалов Шри Шри / Art of Living требует разрешений правообладателей. Исторически прототип допускал нейтральные заглушки. В текущем продакшене в репозитории лежат реальные медиа — при внешнем анализе это нужно явно учитывать (лицензии, модерация VK, App Review если появится).

В i18n есть `welcome.disclaimer` (не замена медпомощи), но **на WelcomeScreen сейчас не отображается**.

### 2.4. Основные пользовательские сценарии

1. **Быстрый старт guided** — Welcome → Practice → карточка → Session → End.
2. **Садхана** — вкладка Sadhana → готовая практика → setup фаз/альтернатив → таймер фаз.
3. **Своя садхана** — конструктор блоков → сохранить → запуск как custom-practice.
4. **Свой трек** — загрузка аудио (≤ 50 МБ) → таймер с loop.
5. **Офлайн (PWA)** — скачать пакет → практика без сети.
6. **VK** — то же + шеринг результата, sync прогресса, избранное, инвайт друзей.

---

## 3. Пользовательский флоу и экраны

Роутинг: `react-router-dom` v6.  
Во VK используется **`HashRouter`** (чтобы не терять `vk_*` launch-параметры).  
Вне VK — **`BrowserRouter`**.

```
/  → Splash (~1.4 с) → /welcome → /practice → /session → /end
                                      ↑__________________|
/picker → редирект на /practice
```

| Маршрут | Экран | Файл | Содержание |
|---------|-------|------|------------|
| `/` | Splash | `src/screens/SplashScreen.tsx` | логотип/название, автопереход |
| `/welcome` | Welcome | `src/screens/WelcomeScreen.tsx` | видео-фон, CTA; во VK — имя + аватар |
| `/practice` | Practice Hub | `src/screens/PracticeHubScreen.tsx` | вкладки, каталог, recent, offline, tools |
| `/session` | Session | `src/screens/SessionScreen.tsx` | плеер / фазы / таймер, focus mode |
| `/end` | End | `src/screens/EndScreen.tsx` | цитата/медиа Гуруджи, summary, stats, mood, VK-действия |

**Query-параметры**

- `tab=meditations|sadhana` — активная вкладка хаба / контекст возврата.
- `setup=1` — экран настройки перед стартом садханы / custom / custom-practice.
- `debug=1` — укороченные фазы садханы для отладки.

**Вкладки Practice Hub**

- **Медитации** — audio / video карточки, карточка «Продолжить».
- **Садхана** — готовые практики, сохранённые custom practices, tools (свой трек / конструктор).

---

## 4. Модель контента и практики

### 4.1. Режимы сессии (`SessionMode`)

| Mode | Описание | UI сессии |
|------|----------|-----------|
| `guided` | Аудио/видео из каталога | `AudioPlayer` / `GuidedVideoPlayer` |
| `sadhana` | Многоэтапная практика из каталога | `SadhanaPhaseTimer` |
| `custom-practice` | Пользовательская последовательность блоков | тот же `SadhanaPhaseTimer` |
| `custom` | Свой загруженный трек + таймер | `AudioPlayer` (loop) + `Timer` |
| `timer` | Тихий таймер | `Timer` (presets 5/10/20/40 + custom) |

**Замечание для roadmap:** в Practice Hub **нет явного CTA** на silent `timer` — режим есть в типах/store/UI, но старт из каталога не проводён.

### 4.2. Каталог медитаций (`src/data/meditations.json`)

~14 практик. Аудио с флагом offline-precache (пример): `smile`, `om`, `om-short`, `panchakosha`, `tattva`.  
Видео-guided (без default precache): yantra, emptiness и др.

Поля: `id`, `type` (`audio`|`video`), `title`, `durationSeconds`, `mediaUrl`, `language` (`en|ru|hi|multi`), `isOfflinePrecached?`, `backgroundScene?`.

### 4.3. Садхана (`src/data/sadhana.json`)

- **practices** — готовые цепочки фаз (`morning-short`, `sanyam-short`, `sanyam-full`; в данных есть **дубль id `sanyam-short`** — техдолг).
- **blocks** — переиспользуемые блоки (крийя, пранаяма, тишина, samaveda и т.д.) с аудио и длительностью.
- Фазы могут ссылаться на `blockId` / `alternatives` — пользователь выбирает вариант перед стартом (`sadhanaChoicesStore`).

### 4.4. Контент завершения

- `src/data/guruji-content.json` — фото/видео, summaries.
- `src/data/guruji-quotes.js` — цитаты.
- Часть summary-ключей ссылается на устаревшие id → часто fallback на `summaries.default` (контентный долг).

### 4.5. Медиа на диске (`public/media`)

```
audio/          — mp3 практик и блоков
video/          — фоны picker/session + guided mp4
posters/        — welcome1–9, picker, session
textures/       — бумажные текстуры UI
images/         — guruji1–7, decorative
```

Кириллические имена файлов кодируются через `src/utils/mediaUrl.ts`.  
Объём медиа на проде порядка **~2.2 GB** (деплой media отдельно от releases).

---

## 5. Техническая архитектура

### 5.1. Стек

| Слой | Выбор |
|------|--------|
| UI | React 18, TypeScript |
| Сборка | Vite 4 |
| Роутинг | react-router-dom 6 |
| Состояние | Zustand (+ persist) |
| PWA | vite-plugin-pwa / Workbox |
| VK | `@vkontakte/vk-bridge` |
| Стили | vanilla CSS + design tokens в `global.css` (без Tailwind) |

Alias: `@/` → `src/`.  
Node: CI на 20; локально рекомендуется 20–22.

### 5.2. Клиентское состояние (persist)

| Store | Ключ / место | Данные |
|-------|----------------|--------|
| locale | `meditate-locale` | `ru` / `en` |
| session | `meditate-session` (**sessionStorage**) | mode, ids, duration, progress, phase |
| practice stats | `meditate-practice-stats` | totalSessions, streak, month seconds, lastSession |
| recent practice | `meditate-recent-practice` | lastTab, lastMeditation/Sadhana/CustomPractice, updatedAt |
| custom practices | `meditate-custom-practices` | сохранённые практики конструктора |
| sadhana choices | `meditate-sadhana-choices` | выбранные alternatives |
| custom track | IndexedDB `seva-hub` / `custom-tracks` | один blob ≤ 50 МБ |
| VK favorites UI | `meditate-vk-favorites` | asked / added |

Mood на EndScreen **не** пишется в stats и **не** синкается в VK.

### 5.3. Offline / PWA (только не-VK)

- SW autoUpdate; precache shell + audio из `offline-manifest.json`.
- Runtime caching изображений/аудио/видео.
- Ручной пакет: Cache API `meditate-offline-user-v1` через `OfflineDownloadPanel`.
- Install prompt / Add to Home Screen.
- Screen Wake Lock на старте части практик.
- Адаптация фона: static при saveData / медленной сети (`connection.ts`).

Во VK: **SW не регистрируется**, InstallPrompt скрыт — offline в iframe зависит от политики WebView VK.

### 5.4. i18n

Словари `src/i18n/ru.json`, `en.json`. Переключатель в Header.  
Язык **контента** медитации (`hi`, `multi`) ≠ язык UI.

### 5.5. Визуальная система

Тёплая «ashram»-палитра (`#F9F6EE` фон, жёлтый primary, terracotta secondary), шрифты DM Serif Display + Work Sans (Google Fonts), glass panels, текстурные поверхности (`textures` + `textured-surface.css`).  
Документы дизайна (не runtime): `aol-ashram-design-system.md`, `structure.md`.

---

## 6. Интеграция VK Mini Apps

### 6.1. Идентификация и хостинг

- **APP_ID:** `7595020`
- **Ссылка:** `https://vk.com/app7595020`
- **Адрес приложения в настройках VK:** `https://vk.aolapp.ru/`
- **Детекция VK:** hostname `vk.aolapp.ru` **или** `vk_app_id` в query.
- Ранний `VKWebAppInit` в `index.html` (`public/vk-bridge.min.js`) + страховка в `main.tsx`.

### 6.2. Используемые методы Bridge

| Метод | Назначение | Где |
|-------|------------|-----|
| `VKWebAppInit` | обязательная инициализация | `index.html`, `main.tsx` |
| `VKWebAppGetUserInfo` | имя, аватар на Welcome | `vkUserStore` |
| `VKWebAppStorageGet/Set` | облачный sync прогресса и recent | `statsSync`, `recentSync` |
| `VKWebAppShowWallPostBox` | пост на стену | EndScreen |
| `VKWebAppShowStoryBox` | история (фон welcome1.jpg) | EndScreen |
| `VKWebAppShare` | шаринг ссылки | EndScreen |
| `VKWebAppShowInviteBox` | приглашение друзей | EndScreen |
| `VKWebAppAddToFavorites` | в избранное (после ≥ 2 сессий) | EndScreen |

### 6.3. VK Cloud Storage

| Ключ | Содержимое | Лимит |
|------|------------|-------|
| `practice_stats` | streak, totals, lastSession (v1 JSON) | value ≤ **4000** символов (guard в коде) |
| `recent_practice` | lastTab + last ids + updatedAt | тот же лимит |

Стратегия merge: «newer wins» (stats — по `completedAt` / totalSessions; recent — по `updatedAt`).  
Перед hydrate ждётся rehydrate zustand-persist, чтобы не затереть локальное пустым remote.

**Не синкается в VK Storage:** custom practices, custom track, sadhana choices, locale, session, mood.

### 6.4. UX-особенности VK-канала

- Hash-роутинг сохраняет launch params.
- После 2-й сессии — soft-offer «Добавить в избранное».
- Шеринг и Invite — на экране завершения.
- Ошибки бутстрапа могут показываться DOM-оверлеем `[meditate boot]` (отладка iframe).

---

## 7. Инфраструктура и деплой

### 7.1. Сервер

- Хост: `109.73.201.170` (рядом крутятся другие проекты: гайдук.рф, vitaliy-online.ru).
- Root приложения: `/var/www/meditation/current` (symlink на `releases/<timestamp>`).
- Медиа: `/var/www/meditation/media/` (alias nginx `/media/`), переживает `--delete` релизов.
- SSL: Let's Encrypt на `aolapp.ru`, `www.aolapp.ru`, `vk.aolapp.ru`.
- Для VK iframe **нельзя** ставить `X-Frame-Options: DENY` / `frame-ancestors 'none'`.

### 7.2. CI

`.github/workflows/deploy.yaml`: push в `main` → build → rsync release + media → symlink → `nginx reload`.  
Secrets: `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`.

Конфиги: `deploy/nginx-aolapp.conf.example`, `deploy/bootstrap-aolapp.sh`.

### 7.3. Локальная разработка

```bash
npm install
npm run generate-media   # опционально, WAV-заглушки
npm run dev              # http://localhost:5173
npm run build && npm run preview
```

---

## 8. Карта ключевых файлов

```
src/
  App.tsx, main.tsx
  screens/          Splash, Welcome, PracticeHub, Session, End
  components/       players, cards, tabs, offline panel, builder…
  store/            session, stats, recent, custom*, vkUser
  vk/               statsSync, recentSync, favorites, share, invite
  data/             meditations.json, sadhana.json, guruji*, manifests
  utils/            offline, sadhana, textures, vk, mediaUrl…
  styles/global.css
public/media/       audio, video, posters, textures, images
deploy/             nginx + bootstrap
.github/workflows/deploy.yaml
```

---

## 9. Известные ограничения и техдолг (факт из кода)

1. **Нет серверного API / БД** — нет глобальных лидербордов, кросс-платформенного бэкапа custom practices, серверных пушей.
2. **Лимит VK Storage ~4KB** — только компактные агрегаты.
3. **Naive merge** stats/recent — при конфликте устройств возможны потери деталей.
4. **Дубль `sanyam-short`** в `sadhana.json`.
5. **Silent timer без CTA** в хабе.
6. **Disclaimer** в i18n не показан на Welcome.
7. **Устаревшие id** в guruji summaries.
8. **SW/offline слабее во VK** WebView.
9. **Видео-guided** не в default precache.
10. **Один custom track** на устройство; IndexedDB имя `seva-hub` — legacy.
11. **Mood** не аналитится и не хранится в stats.
12. **Нет продуктовой аналитики** (события воронки не инструментированы).
13. README/structure частично устарели (React 19, `/picker` как главный экран).

---

## 10. Направления развития (для анализа, не обязательства)

Ниже — гипотезы roadmap, сгруппированные для приоритизации. Оценка impact/effort — на стороне аналитика.

### A. Продукт / рост

- Онбординг и дисклеймер на Welcome.
- Явный вход в silent timer.
- Улучшение виральности: готовые шаблоны сторис с динамическим текстом (streak/минуты), deep-link на конкретную практику.
- Community: JoinGroup / сообщения сообщества (если есть группа AoL / своя).
- Напоминания: `AllowNotifications` + серверный/VK callback cron (требует инфраструктуры).
- Персонализация по mood / истории (нужно хранить mood).

### B. Контент / редакция

- Синхронизация guruji summaries с актуальными id.
- Чистка дублей садханы, курирование offline-пакета (какие видео включать).
- Мультиязычность контента vs UI (сейчас смешение).
- Правовой аудит медиа и атрибуция.

### C. Платформа / данные

- Тонкий backend (user_id из `vk_user_id` + JWT/session): stats history, custom practices sync, analytics.
- Более умный CRDT/field-merge для Storage или отказ от Storage в пользу backend.
- Единый sync layer (не два почти одинаковых модуля stats/recent).
- Feature flags: VK vs PWA поверхности.

### D. UX / качество

- Сократить/перекомпоновать EndScreen (много CTA во VK: share ×3 + invite + favorites).
- Self-host fonts (Google Fonts могут резаться CSP iframe VK).
- Accessibility / reduced motion (частично есть).
- Тесты критических путей: session complete → stats → VK push; recent restore.

### E. Ops

- Актуализировать GitHub secrets под текущий хост.
- Мониторинг места на диске (медиа ~2GB+).
- Документированный runbook деплоя (частично в `deploy/`).
- Привести README в соответствие с кодом.

---

## 11. Критерии успеха (предложение для аналитика)

Заполнить метриками после появления аналитики:

| Воронка | Событие |
|---------|---------|
| Активация | открытие app → старт 1-й сессии |
| Retention D1/D7 | повторная сессия |
| Depth | завершение (End) vs early exit |
| VK viral | wall/story/invite/favorites accept rate |
| Offline | download pack → offline session |
| Sadhana | доля sadhana vs guided |

Пока событий в коде **нет** — это блокер количественного анализа.

---

## 12. Быстрый справочник констант

```
VK_APP_ID                 = 7595020
VK_APP_URL                = https://vk.com/app7595020
VK host                   = vk.aolapp.ru
PWA hosts                 = aolapp.ru, www.aolapp.ru
VK Storage keys           = practice_stats, recent_practice
VK value size guard       = 4000 chars
FAVORITES_AFTER_SESSIONS  = 2
Deploy path               = /var/www/meditation
MAX_CUSTOM_TRACK_BYTES    = 50 MB
USER_OFFLINE_CACHE        = meditate-offline-user-v1
```

---

## 13. Приложения для глубокого чтения в репо

| Документ / зона | Зачем |
|-----------------|--------|
| `structure.md` | исходное продуктовое ТЗ (частично устарело) |
| `aol-ashram-design-system.md` | визуальный язык |
| `src/types/index.ts` | доменная модель |
| `src/vk/*` | контракт VK-интеграции |
| `deploy/nginx-aolapp.conf.example` | прод-хостинг |
| `src/data/meditations.json`, `sadhana.json` | каталог контента |

---

*Документ составлен по состоянию кодовой базы на 2026-09-10. При расхождении с runtime предпочтение у кода.*
