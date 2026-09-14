# Meditate with Sri Sri (PWA + VK Mini App)

Медитации и садхана с Шри Шри: PWA на `aolapp.ru` и VK Mini App [`7595020`](https://vk.ru/app7595020).

## Запуск

**Node ≥ 18** (рекомендуется 20+). Проверка: `node -v`

```bash
npm install
npm run generate-media
npm run dev
```

Откройте `http://localhost:5173`. Для PWA/SW: `npm run build && npm run preview`.

Тесты критических путей: `npm test`.

## Экраны

- `/` — splash (returners → `/practice?focus=continue`)
- `/welcome` — приветствие (новички)
- `/onboarding` — 14-дневный старт (promise → slot → pick)
- `/practice` — хаб: медитации, садхана, silent timer, незавершённые
- `/session` — сессия (guided / timer / sadhana / custom)
- `/end` — завершение, streak, VK share/reminders
- `/picker` — редирект на `/practice` (legacy)

## Медиа и данные

- Медитации: `src/data/meditations.json` → файлы в `public/media/`
- Садханы: `src/data/sadhana.json`
- Гуруджи (фото/резюме): `src/data/guruji-content.json`
- Офлайн-манифест: `npm run offline:manifest` → `src/data/offline-manifest.json`

## VK

- Host: `vk.aolapp.ru`, детект по hostname или `vk_app_id`
- Sync: `src/vk/statsSync.ts` + `recentSync.ts` (общий слой `vkStoreSync`)
- Напоминания: `scripts/notifier/` + systemd units в `deploy/`

## Стек

React 18, TypeScript, Vite, vite-plugin-pwa, Zustand, React Router, Vitest, self-hosted fonts (`@fontsource/*`).

## Документация

- Стратегия / роадмап: `docs/STRATEGY.md`
- Handoff: `docs/PRODUCT_HANDOFF.md`
- `structure.md` — **историческое ТЗ** (не актуальная карта экранов)
