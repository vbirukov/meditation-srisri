# Фоны карточек и заголовков разделов

Референсы: **Akshardham (Дели)** — розовый песчаник, барельефы, купола, мандала-потолки; **Vishalakshi Mantap (Ашрам Искусства Жизни, Бангалор)** — белый/кремовый мрамор, ярусы «лотоса», тёплый вечерний свет.

Файлы кладутся в `public/media/textures/`. После добавления: `npm run media:manifest`.

## Именование

| Пул | Файлы | Где в UI |
|-----|-------|----------|
| `meditation-card` | `meditation-card.jpg`, `meditation-card1.jpg`, … | карточки медитаций |
| `sadhana-card` | `sadhana-card.jpg`, `sadhana-card1.jpg`, … | карточки садханы |
| `section-header` | `section-header.png`, `section-header1.png`… | баннеры «Аудио», «Видео», «Садхана» — **только орнамент/текстура**, без зданий |
| `practice-tools` | `practice-tools.png`, `practice-tools1.png`… | блок таймера / своей дорожки |
| `session-chrome` | `session-chrome.png`, `session-chrome1.png`… | шапка сессии (название практики) |

**Карточки медитаций / садханы / practice-tools:** текстура только в **правом нижнем углу** (blur + градиент влево-вверх). Важный контент — слева.

**session-chrome / section-header:** **орнамент без зданий**; chrome — frieze сверху, чистый центр под заголовок.

Экран завершения: [end-screen-backgrounds.md](./end-screen-backgrounds.md).

Форматы: `.png`, `.jpg`, `.jpeg`, `.webp` — без разницы. При загрузке страницы для каждого **типа** (meditation-card, section-header, …) выбирается один случайный вариант — все однотипные элементы на экране получают одну и ту же текстуру (`usePageTextures`).

## Технические требования

- **Карточки / practice-tools:** горизонтальный кроп ~3:1; деталь **в правой нижней трети** кадра (левая часть — однотонный песчаник/крем под текст).
- **Заголовки секций:** горизонтальная полоса ~4:1, 1600×400 px; **абстрактный орнамент** (решётка, мандала, лотос), без зданий и перспективы; левая половина — ровный cream/песчаник под текст.
- **Палитра:** песчаник `#c4a484`, крем `#f9f6ee`, терракота `#c45c3e` — не перебивать UI.
- Без людей крупным планом, без логотипов, без водяных знаков.

---

## meditation-card — Akshardham (серия A)

**A1 — коридор колонн**
```
Close-up architectural background texture, Indian temple sandstone corridor, massive carved pillars with dancers and deities in relief, warm peach-beige sandstone, soft side daylight, shallow depth of field, meditative serene mood, Akshardham Delhi style, no people, horizontal crop for mobile card, low contrast, subtle blur at edges, photorealistic
```

**A2 — музыканты на стене**
```
Macro stone relief background, four celestial musicians carved in pink sandstone, traditional veena and drums, ornate lattice mandala patterns beside figures, warm monochromatic beige terracotta, gentle shadows, sacred craftsmanship, horizontal banner crop, soft focus background, meditation app card texture, no text
```

**A3 — купол снизу (мягкий)**
```
Looking up at ornate temple dome ceiling, concentric mandala rings in carved sandstone, radial symmetry, warm ochre beige, soft diffused light, spiritual grandeur, heavily blurred for UI background, horizontal wide crop, low saturation overlay-friendly
```

---

## meditation-card — Vishalakshi Mantap (серия B)

**B1 — лотос-ярусы на закате**
```
Vishalakshi Mantap style white marble lotus-tiered meditation hall at dusk, cream off-white stone, warm golden interior glow, symmetrical tiers, soft pale sky, serene spiritual architecture, wide horizontal crop, gentle haze, no crowds, card background texture
```

**B2 — отражающий бассейн**
```
White marble walkway with narrow reflecting pool leading to circular tiered temple, twilight blue-grey sky, warm lights in arches, peaceful ashram atmosphere, horizontal strip composition, slightly desaturated for text overlay
```

---

## sadhana-card — Akshardham (серия S)

Садхана — чуть теплее/терракотовее градиент в UI; фон может быть плотнее по резьбе.

**S1 — слоновий пояс (Gajendra Pith)**
```
Horizontal stone frieze of carved elephants in procession, pink sandstone temple base, warm afternoon light, ancient Indian craftsmanship, wide crop, shallow depth, meditative strength, no full temple, texture for card header area
```

**S2 — колонны снизу**
```
Low angle carved sandstone pillars, tiers of dancers and floral bands, warm peach stone, dramatic but soft lighting, sacred interior, horizontal background for practice card, blurred top and bottom
```

**S3 — золотые двери (далёкий план)**
```
Temple interior corridor, dark bronze doors with golden sunburst medallions, white marble floor accents, sandstone walls, soft natural light from left, shallow depth, wide horizontal crop, calm reverent mood
```

---

## sadhana-card — Vishalakshi (серия V)

**V1 — купол и kalash**
```
White cream circular meditation hall dome with golden kalash finial, lotus petal scalloped tiers, evening sky, warm spotlights on stone, Art of Living ashram aesthetic, horizontal card background, soft glow
```

---

## section-header — орнаменты (НЕ фото зданий)

**Важно:** не храм целиком, не купол, не фасад, не перспектива. Только **плоский декоративный орнамент** в духе Akshardham / Vishalakshi: jali-решётка, лотос, мандала, каменная резьба как **текстура**, не как объект.

Левая 50–60% кадра — почти однородный warm cream `#f9f6ee`. Деталь — только справа. Низкий контраст, без мелкого текста.

**Negative (добавлять к каждому):**
```
building, temple, dome, architecture, skyline, perspective, 3d scene, photograph, people, sky, water, landscape, text, watermark, high contrast, busy center
```

**O1 — jali lattice (песчаник)**
```
Seamless horizontal ornamental strip, abstract Indian sandstone jali geometric lattice pattern, warm beige peach terracotta, flat 2d surface texture, low contrast, decorative stone screen motif, left half uniform calm cream beige empty, ornament detail concentrated on right third only, no buildings no objects, tileable banner 4:1
```

**O2 — лотос-скаллоп (Vishalakshi)**
```
Flat decorative lotus petal scallop border pattern, cream white marble tone with soft terracotta accent, repeating horizontal frieze, abstract ornamental band not architecture, left two thirds smooth empty cream, subtle pattern on right edge only, seamless texture strip 4:1, meditative minimal
```

**O3 — мандала-кольцо (фрагмент)**
```
Abstract concentric mandala ring fragment, carved stone ornament style, warm ochre beige sandstone, flat graphic not a ceiling photo, partial arc of floral geometric rings on right side, left side solid warm cream gradient, low saturation, banner texture 4:1, no dome no perspective
```

**O4 — floral vine frieze**
```
Horizontal stone carving frieze pattern, delicate floral vine and leaf scrolls, Akshardham-inspired relief texture flattened to 2d, warm peach sandstone monochrome, calm left zone plain beige, ornamental detail fading toward right, subtle shadows, not a photograph of a wall corner
```

**O5 — колесо / dharmachakra (геометрия)**
```
Repeating abstract dharmachakra wheel motifs in square grid, sandstone beige ornamental texture, flat seamless pattern, spiritual geometric decoration, left half nearly blank cream, wheels smaller and softer on right, low contrast tile 4:1, no figurative scenes
```

**O6 — точечный песчаник (минимал)**
```
Ultra subtle sandstone grain texture with faint carved dot and line ornament, almost solid warm cream on left 65 percent, whisper of decorative border on far right, extremely low contrast, premium UI section divider background, 4:1 horizontal strip
```

---

## session-chrome — шапка экрана сессии

Панель с **центрированным** названием практики. Орнамент — **верхняя кайма / frieze**; центр и низ — ровный cream под текст. Без зданий, без перспективы (как section-header).

**Negative (добавлять к каждому):**
```
building, temple, dome, architecture, perspective, photograph, sky, water, landscape, text, watermark, busy center, high contrast
```

**SC1 — лотос-фриз сверху**
```
Wide horizontal panel texture, abstract lotus petal scallop frieze along top edge only, Vishalakshi-inspired cream white ornament, lower two thirds solid calm warm cream empty for centered title, flat 2d decorative band, sandstone beige accents, 16:9 or 3:1, no architecture
```

**SC2 — мандала-дуга (корона)**
```
Abstract mandala arc crown spanning top width, concentric floral rings cropped flat, warm ochre beige sandstone ornament, center and bottom uniform cream beige for typography, low contrast, horizontal panel 16:9, no dome photo no perspective
```

**SC3 — jali верхняя полоса**
```
Horizontal UI chrome texture, Indian jali geometric lattice strip on top 30 percent only, warm peach sandstone, flat seamless ornament, large peaceful cream center zone, bottom fade to solid cream, 16:9 banner, no buildings
```

**SC4 — двойная кайма (верх + низ)**
```
Symmetrical top and bottom thin floral vine frieze borders, Akshardham stone carving style flattened to 2d, wide empty cream center band for session title, warm beige terracotta, horizontal 3:1 strip, minimal calm
```

**SC5 — минимальный песчаник**
```
Subtle sandstone grain with faint top ornamental border line, ultra calm cream center 70 percent, whisper of decorative pattern at top edge only, premium meditation session header, 16:9, extremely low contrast
```

---

## practice-tools — панель инструментов

**P1**
```
Horizontal sandstone temple detail for UI panel, ornate carving concentrated in bottom right corner, left two thirds smooth warm beige cream empty, soft blur fade toward top left, Akshardham style, no text
```

---

## Negative prompt (общий)

```
text, watermark, logo, crowd, selfie, modern glass building, neon, oversaturated, harsh HDR, cartoon, anime, low resolution, blurry center, faces close-up, political symbols
```

---

## После генерации

1. Экспорт JPG/WebP, сжатие ~80–85 quality, &lt; 200 KB на карточку если возможно.
2. Положить в `public/media/textures/` с именами выше.
3. `npm run media:manifest` — проверить `src/data/texture-manifest.json`.
4. Перезапустить dev — карточки и `SectionTitle` подхватят фоны автоматически.
