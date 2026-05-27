# Медиа-ассеты проекта: список и промпты

Палитра ашрама (для всех промптов): крем `#F9F6EE`, песок `#F2E5CF`, терракота `#C6744A`, солнце `#FFE15A`, зелень `#5F8C57`, вода `#3E7C78`. Без кислотных цветов, без резких вспышек.

**Общий negative prompt** (добавляй ко всем):
```
text, watermark, logo, UI, frame, border, oversaturated, neon, harsh flash, horror, violence, crowded tourists, selfie, phone screen, cold blue filter, cartoon, anime, low quality, blurry faces
```

---

## Статус

| Статус | Значение |
|--------|----------|
| ✅ | уже есть / пользователь добавил |
| 🔶 | заглушка SVG, нужен реальный файл |
| ⬜ | ещё нет |

---

## 1. Welcome — фоны приветствия (постеры)

**Путь:** `public/media/posters/welcome1.jpg` … `welcome9.jpg`  
**Экран:** `/welcome` (случайный кадр при каждом заходе)  
**Размер:** 1080×1920 (9:16) или 1280×720 минимум, JPG/WebP  
**Статус:** ✅ (9 файлов, если положены в posters)

**Назначение:** рассвет/закат в ашраме Art of Living, ощущение приглашения сесть. Лица не крупным планом — архитектура, свет, природа.

**Промпт (базовый, варьируй сцену в 9 версиях):**
```
Vertical 9:16 photograph, Art of Living Bangalore ashram at golden hour, warm cream and terracotta architecture, white domes, soft sunrise light #FFE15A, gentle mist, green hills in distance, peaceful empty courtyard or walkway, no people in foreground, meditative atmosphere, soft depth of field, photorealistic, calm warm color grading
```

**Вариации (меняй одну деталь на файл):**
1. `welcome1` — общий план ашрама, восход  
2. `welcome2` — терракотовые крыши и купола, мягкий свет  
3. `welcome3` — аллея с деревьями, утро  
4. `welcome4` — ступени/мраморный двор, пусто  
5. `welcome5` — вид на холмы и зелень  
6. `welcome6` — закатное тёплое небо  
7. `welcome7` — фонтан или вода вдали, отражение  
8. `welcome8` — колоннада / зал снаружи  
9. `welcome9` — узкий проход, свет в конце

**Опционально видео:** `public/media/video/welcome.mp4` — 15–30 с, loop, без звука, тот же визуальный ряд.

---

## 2. Practice hub — фон выбора практики

**Постер (fallback):** `public/media/posters/picker.jpg` 🔶 сейчас `picker.svg`  
**Видео:** `public/media/video/picker.mp4`, `picker2.mp4` ✅  
**Экран:** `/practice`  
**Размер постера:** 9:16; видео 1080p, 20–40 с loop

**Промпт постер / видео:**
```
Vertical 9:16, slow cinematic walk through Art of Living ashram gardens, tree-lined path, Ganga river or water channel visible in background, warm cream walls, terracotta accents, soft afternoon light, camera slowly moving forward at walking pace, empty peaceful path, no crowds, meditative mood, photorealistic, gentle motion blur on leaves
```

**Второе видео `picker2`:** тот же стиль, но **вид сбоку на воду и деревья**, без архитектуры крупно.

---

## 3. Session — фон медитации

**Постер:** `public/media/posters/session.jpg` 🔶 сейчас `session.svg`  
**Видео:** `public/media/video/session.mp4`, `session2.mp4` ✅  
**Экран:** `/session`  
**Размер:** 9:16 / 1080p video

**Промпт `session1`:**
```
Vertical 9:16, meditation hall or quiet lakeside at ashram, still water reflecting warm sky, minimal movement, soft ripples only, cream and green tones, empty meditation spot, no people, very calm, photorealistic, suitable as looping video background, golden hour
```

**Промпт `session2`:**
```
Vertical 9:16, rolling green hills near ashram, slow clouds, warm light, distant trees, no buildings dominant, peaceful Indian countryside, extremely slow subtle motion for loop, meditative wallpaper style
```

---

## 4. Guided video — «Закат у воды»

**Путь:** `public/media/video/sunset-visual.mp4` ⬜  
**Экран:** сессия guided `sunset-visual`  
**Длительность:** ~10 мин loop или однократный клип с crossfade  
**Без голоса** — только визуал

**Промпт:**
```
Horizontal or vertical calm sunset over water, Ganga or peaceful lake, orange and cream sky #F2E5CF #FFE15A, silhouette of far shore, no sun disc directly in center, very slow water movement, no people, no boats, loop-friendly 10 minutes feel, photorealistic, soft haze, meditation visual
```

---

## 5. Экран завершения — портрет Гуруджи

**Пути:** `public/media/images/guruji1.jpg` … `guruji7.jpg` ✅  
**Экран:** `/end` (случайный портрет)  
**Размер:** 800×960 (5:6) портрет, JPG

**Важно:** для продакшена — **только официальные фото с разрешением**. AI — временные заглушки.

**Промпт (если нужны нейтральные заглушки без узнаваемого лица):**
```
Portrait 5:6, serene Indian spiritual teacher silhouette in soft focus, warm cream background, gentle smile implied but face softly blurred and not identifiable, saffron and white robes suggested, ashram photography style, soft window light, dignified calm, no text, not a celebrity likeness
```

**Negative для заглушек:**
```
recognizable celebrity, Sri Sri Ravi Shankar likeness, sharp identifiable face, caricature
```

**Опционально (будущее):** `guruji-content.json` → `media.video` — 5–10 с, молчание, лёгкий кивок/улыбка, loop.

---

## 6. Кнопка Welcome — текстура терракоты

**Путь:** `public/media/images/welcome-cta-bg.jpg` ⬜  
**Использование:** фон кнопки «Начать медитацию»

См. отдельно: [welcome-cta-button-background.md](./welcome-cta-button-background.md)

---

## 7. PWA — иконки приложения

**Пути:** `public/icons/icon-192.svg`, `icon-512.svg` 🔶 (сейчас простые SVG)

**Нужно для сторов:** PNG 192×192, 512×512 (можно экспорт из SVG или сгенерировать)

**Промпт:**
```
App icon square, minimal flat design, warm sun disc #FFE15A on cream background #F9F6EE, subtle terracotta arch or lotus hint, Art of Living ashram mood, no text, no face, clean edges, centered symbol, meditation wellness app, soft gradient, professional iOS Android icon
```

---

## 8. Splash (опционально)

Сейчас градиент + символ ॐ. При желании:

**Путь:** `public/media/images/splash-bg.jpg`  
**Размер:** 1080×1920

**Промпт:**
```
Vertical abstract warm gradient, cream #F9F6EE to soft gold #FFE15A, subtle terracotta texture at bottom, no objects, no text, minimal meditation app splash background
```

---

## 9. Аудио (не картинки, но в списке медиа)

| Файл | Назначение |
|------|------------|
| `public/media/audio/bell.wav` | конец таймера / этапа садханы |
| `public/media/audio/breath-5.wav` | guided медитация |
| `public/media/audio/gratitude-10.wav` | guided |
| `public/media/audio/silence-15.wav` | guided |
| Реальный голос/музыка | заменить заглушки |

---

## Приоритет производства

1. **Высокий:** `welcome1–9`, `picker`/`session` видео + JPG-постеры, `guruji1–7` (официальные фото), `welcome-cta-bg.jpg`  
2. **Средний:** `sunset-visual.mp4`, PWA PNG 192/512  
3. **Низкий:** `splash-bg`, видео Гуруджи на end, `welcome.mp4`

---

## Технические требования

- **Фото:** JPG quality 85+ или WebP; портреты до 400 KB после сжития  
- **Видео:** H.264 MP4, без аудиодорожки для фонов, bitrate умеренный (2–4 Mbps), loop-friendly (начало ≈ конец)  
- **Контент:** без узнаваемых людей без прав; для Шри Шри — только с одобрения правообладателя  

---

## Автоподхват постеров

Положи файлы в `public/media/posters/` по шаблону:

- `welcome.jpg`, `welcome1.jpg` … `welcome99.jpg`
- `picker.jpg`, `picker1.jpg`, `picker2.jpg` …
- `session.jpg`, `session1.jpg`, `session2.jpg` …

Перед `dev` / `build` запускается `npm run media:manifest` — обновляет `poster-manifest.json` и `texture-manifest.json`.  
Постеры: если растровых файлов нет — fallback на `welcome.svg` / `picker.svg` / `session.svg`.

**Текстуры** (`public/media/textures/`): [card-header-backgrounds.md](./card-header-backgrounds.md), [end-screen-backgrounds.md](./end-screen-backgrounds.md).
