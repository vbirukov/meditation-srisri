# Фоны экрана завершения (`/end`)

Референсы: **Akshardham (Дели)**, **Vishalakshi Mantap (Бангалор)** — как в [card-header-backgrounds.md](./card-header-backgrounds.md).

Файлы: `public/media/textures/`. После добавления: `npm run media:manifest`.

## Именование

| Пул | Файлы | Элемент UI |
|-----|-------|------------|
| `end-screen` | `end-screen.png`, `end-screen1.png`… | фон всего экрана (fixed, лёгкий scrim) |
| `end-hero` | `end-hero.png`, `end-hero1.png`… | блок портрета Гуруджи + цитата |
| `end-summary` | `end-summary.png`… | карточка «Итог сессии» |
| `end-stats` | `end-stats.png`… | панель стрика / месяца / сессий |
| `end-mood` | `end-mood.png`… | блок выбора настроения |

Форматы: `.png`, `.jpg`, `.webp`. Экран — случайный вариант при каждом заходе; панели — стабильно по ключу.

## Размеры

| Пул | Кроп | Размер |
|-----|------|--------|
| `end-screen` | вертикальный, много «воздуха» | 1080×1920, сильно размытый или мягкий деталь |
| `end-hero` | 4:3, центр спокойный под портрет | 1200×900 |
| `end-summary` | горизонтальный 3:1 | 1200×400 |
| `end-stats` | горизонтальный 3:1 | 1200×400 |
| `end-mood` | горизонтальный 3:1 | 1200×400 |

Сжатие: целевой вес **150–400 KB** на файл (сейчас PNG по 5–9 MB — тяжело для PWA).

---

## end-screen — ambient

**E1 — купол-мандала (размыто)**
```
Very soft blurred Indian temple mandala dome ceiling, warm sandstone beige, ethereal morning light, extremely low detail bokeh, vertical mobile wallpaper, meditative completion screen background, no text, no people
```

**E2 — Vishalakshi на закате (дальний план)**
```
Out of focus white lotus-tiered Vishalakshi Mantap at dusk, cream marble, golden glow, pale sky, dreamy haze, vertical full screen background, serene spiritual, heavily softened
```

**E3 — небо над шикхарами**
```
Soft cloudy sky above blurred pink sandstone temple spires, warm peach tones, minimal detail, peaceful vertical gradient-friendly background
```

---

## end-hero — портрет + цитата

**H1 — Vishalakshi фасад**
```
Vishalakshi Mantap white marble lotus tiers at golden hour, symmetrical, warm interior light in arches, wide soft crop, space in upper center for portrait overlay, spiritual ashram, horizontal 4:3
```

**H2 — колоннада Akshardham**
```
Sandstone temple colonnade soft side light, carved pillars blurred at edges, warm peach stone, reverent calm, horizontal panel background for quote card
```

**H3 — мандала-потолок (кроп низ)**
```
Carved stone mandala ceiling detail, concentric rings, warm ochre beige, soft light from above, horizontal crop lower third calmer for UI overlay
```

---

## end-summary — итог практики

**S1 — золотые двери / коридор**
```
Temple interior corridor soft focus, sandstone walls, warm light, horizontal strip, celebratory calm mood, space for centered text
```

**S2 — терракотовый песчаник, барельеф**
```
Close horizontal sandstone relief with dancers, warm terracotta beige, gentle shadows, Akshardham style, banner crop for summary card
```

---

## end-stats — три метрики

**T1 — геометрический орнамент**
```
Repeating stone lattice and wheel motifs, warm beige sandstone texture, horizontal wide crop, subtle pattern for stats panel background
```

**T2 — слоновий фриз (мягкий)**
```
Horizontal elephant stone frieze Gajendra Pith style, pink sandstone, soft afternoon light, wide banner, low contrast edges
```

---

## end-mood — настроение

**M1 — лотос-ярусы крупно**
```
White marble lotus petal scalloped tiers close-up, cream tones, soft twilight, peaceful horizontal strip for mood selector panel
```

**M2 — отражающий бассейн (узкая полоса)**
```
Marble walkway reflecting pool at ashram dusk, symmetrical, calm water mirror, wide horizontal crop, desaturated for UI
```

---

## Negative prompt

```
text, watermark, logo, crowd, faces close-up, harsh contrast, neon, cartoon, political symbols, oversaturated HDR
```

## Проверка

1. Положить файлы в `textures/`
2. `npm run media:manifest`
3. Пройти сессию до `/end` — фон экрана + панели с текстурой; без файлов — как раньше (glass / gradient).
