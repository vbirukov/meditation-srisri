# Meditate with Sri Sri (PWA)

Минималистичное PWA для guided-медитаций и таймера. Прототип с нейтральными заглушками медиа (без официального контента Шри Шри).

## Запуск

**Нужен Node ≥ 16** (рекомендуется 20+). Проверка: `node -v`

Если `npm run dev` падает с `crypto.getRandomValues is not a function` — у тебя старый Node в PATH. Обнови [Node.js LTS](https://nodejs.org/) или `nvm use` (см. `.nvmrc`).

```bash
npm install
npm run generate-media
npm run dev
```

Откройте `http://localhost:5173`. Для PWA/service worker используйте `npm run build && npm run preview` (нужен HTTPS или localhost).

## Экраны

- `/` — splash
- `/welcome` — приветствие
- `/practice` — медитации и садхана (вкладки); `/picker` редирект сюда
- `/session` — сессия (guided / таймер)
- `/end` — завершение

## Медиа

Замените файлы в `public/media/` на реальные видео (webm/mp4) и аудио. Список медитаций — `src/data/meditations.json`. Welcome-фон: `public/media/posters/welcome1.jpg` … `welcome9.jpg` (случайный при заходе на `/welcome`).

Цитаты, резюме и фото Гуруджи — `src/data/guruji-content.json`. Фото: `public/media/images/guruji1.jpg` … `guruji7.jpg` (случайное на экране завершения; заглушка `guruji.svg`).

Садханы (многоэтапные таймеры) — `src/data/sadhana.json`.

Сгенерировать тихие WAV-заглушки: `npm run generate-media`.

## Стек

React 19, TypeScript, Vite, vite-plugin-pwa, Zustand, React Router.
