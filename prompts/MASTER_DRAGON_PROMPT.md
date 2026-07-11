# MASTER_DRAGON_PROMPT.md — Драконы

Персонаж, не монстр: большие добрые глаза, улыбка, узнаваемый силуэт, стадии 1/25/60/100.

## 1. Художественный стиль (неизменяемо)
Cozy storybook fantasy illustration, modern children's picture-book art, hand-painted gouache/soft watercolor feel, soft rounded shapes, friendly and warm, whimsical and magical. Warm bright palette: cream paper, emerald forests, turquoise water, golden sunlight, orange sunset, lavender-tinted soft shadows, glowing plants. Soft cinematic lighting, single warm key light upper-left, gentle rim light, golden-hour mood. Uniform ~2px soft warm-brown hand-drawn outline. Medium detail, clean readable silhouette, soft matte materials.

## 2. Композиция
Один герой (центр/правило третей), спокойный фон тише героя, воздух вокруг, единый визуальный вес.

## 3. Палитра
Только токены `design/tokens/tokens.json` (paper/emerald/turquoise/sun/sunset/lavender + стихии + редкость).
Одна доминанта + 1–2 акцента. Никакой серости/кислоты.

## 4. Освещение
Тёплый ключ сверху-слева, мягкий rim, лавандовые мягкие тени. Настроение — золотой час.

## 5. Материалы
Матовая ручная роспись; лёгкий глянец только на самоцветах/яйцах/воде/свечении. Без металла-RPG.

## 6. Ограничения (негатив)
no realism, no photorealistic, no dark fantasy, no grimdark, no horror, no scary/aggressive creatures, no low-poly, no 3D render, no pixel art, no anime, no neon, no acid/muddy colors, no grey, no pure black/white, no harsh contrast, no metallic RPG UI, no gritty textures, no gloom.

## 7. Правила генерации
- Один сид-диапазон на серию (консистентность). image-to-image по утверждённым референсам.
- Соблюдать чек-лист `design/STYLE_GUIDE.md` (тест «одной команды»).

## 8. Прозрачность
Персонажи/иконки/яйца/предметы — прозрачный фон (alpha). Сцены/фоны — без alpha, атмосферные.

## 9. Размер изображения
Иконка 256², яйцо/предмет 512², персонаж 1024², сцена/фон 16:9 под целевой размер. Итоговый файл —
по габаритам заменяемого ассета (`design/ASSET_NAMING.md`).

## 10. Масштабирование
Генерировать в 2× и даунскейлить; фоны полёта держать ≤400–600 КБ (WebP). Серии — партиями с фиксированной
преамбулой; регресс стиля ловить чек-листом.
