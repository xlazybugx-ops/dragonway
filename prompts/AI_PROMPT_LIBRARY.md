# AI_PROMPT_LIBRARY.md — библиотека промптов

Фундамент массовой генерации. Любой ассет = **[STYLE PREAMBLE] + [ASSET BLOCK] + [NEGATIVE]**.
Преамбула НЕИЗМЕННА — она гарантирует единый стиль всей команды.

---

## 1. STYLE PREAMBLE (неизменяемая — вставлять в КАЖДЫЙ промпт)
```
Cozy storybook fantasy illustration, modern children's picture-book art, hand-painted gouache /
soft watercolor feel, soft rounded shapes, friendly and warm, whimsical and magical, painterly
stylized illustration. Warm bright palette: cream paper, emerald forests, turquoise water, golden
sunlight, orange sunset, lavender-tinted soft shadows, glowing plants. Soft cinematic lighting with a
single warm key light from the upper-left, gentle rim light, golden-hour mood. Uniform ~2px soft
warm-brown hand-drawn outline. Medium detail, clean readable silhouette, soft matte materials with a
gentle highlight. Cohesive, cozy, safe, wondrous — looks made by one art team.
```

## 2. NEGATIVE (неизменяемая — добавлять в каждый промпт)
```
no realism, no photorealistic, no dark fantasy, no grimdark, no horror, no scary or aggressive
creatures, no sharp teeth threat, no low-poly, no 3D render, no pixel art, no anime, no manga,
no neon, no acid colors, no muddy or dull colors, no grey, no pure black, no pure white, no harsh
contrast, no heavy metallic RPG UI, no gritty textures, no blood, no gloom.
```

## 3. Общие требования (для всех блоков)
- **Композиция:** один герой в центре/по правилу третей, спокойный фон, воздух вокруг.
- **Освещение:** тёплый ключ сверху-слева, мягкий rim, лавандовые мягкие тени.
- **Палитра:** только из `COLOR_SYSTEM.md`/токенов; 1 доминанта + 1–2 акцента.
- **Детализация:** средняя; силуэт читаем; форма важнее деталей.
- **Силуэт:** узнаваем в чёрном контуре.
- **Материалы:** матовые, ручная роспись; глянец только на самоцветах/яйцах/воде/свечении.
- **Фон:** для персонажей/иконок/яиц — **прозрачный** (alpha); для сцен — атмосферный слоистый.
- **Ограничения:** соблюдать NEGATIVE; ничего из «строго запрещено».

## 4. Как собирать промпт
`{PREAMBLE}. {ASSET BLOCK из PROMPT_TEMPLATES.md с подстановкой переменных}. {NEGATIVE}.`
Плюс технические параметры (размер/прозрачность/сид) из шаблона. Один сид-диапазон на серию для
консистентности. Имена файлов — строго по `ASSET_NAMING.md`.

## 5. Контроль качества серии
Каждый выход прогоняется по чек-листу стиля (STYLE_GUIDE §«тест одной команды»). Брак — перегенерация
с тем же PREAMBLE. Референсы утверждённых ассетов класть в `art/refs/{category}/` как образцы для
image-to-image (консистентность).
