# Промпт: текстура фона кнопки «Начать медитацию»

Сохранить как: `public/media/images/welcome-cta-bg.png` (или `.jpg` / `.webp`)

После добавления файла раскомментировать в `WelcomeScreen.css`:

```css
.welcome-screen__cta {
  --welcome-cta-bg: url('/media/images/welcome-cta-bg.png');
}
```

---

## English (для Midjourney / DALL·E / SD)

```
Seamless tileable texture, warm terracotta clay surface, hand-made Indian roof tile / earthenware glaze, soft matte finish, subtle irregular grain and gentle kiln marks, color palette #C6744A and #A95C37 with cream highlights #F2E5CF, no text, no objects, no people, no hard shadows, evenly lit, meditation app UI button background, horizontal wide crop 3:1 aspect ratio, photorealistic but calm, Art of Living ashram aesthetic, Bangalore warm sunlight
```

## Negative prompt

```
text, letters, logo, button shape, border, icon, flower, pattern repeat seams, high contrast, neon, blue, cold tones, glossy plastic, 3D render, watermark
```

## Русский (альтернатива)

```
Бесшовная текстура тёплой терракотовой глины, ручная обжиговая черепица или керамика ашрама, матовая поверхность, мягкие неровности и лёгкие следы обжига, оттенки терракоты #C6744A и #A95C37 с кремовыми бликами, без текста и объектов, ровный мягкий свет, фон для кнопки медитационного приложения, горизонтальный кадр 3:1, спокойная фотореалистичность, атмосфера ашрама Art of Living
```

## Параметры

| Параметр | Значение |
|----------|----------|
| Соотношение | 3:1 (например 1200×400 px) |
| Стиль | мягкая терракота, не кислотная |
| Использование | `background-size: cover` + `background-blend-mode: multiply` поверх `#C6744A` |
