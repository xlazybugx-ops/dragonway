# Стихийные печати

Пять печатей для обозначения стихии дракона, способности, противника, награды или требования. Формы различаются не только цветом и остаются узнаваемыми в размере 32 px.

| Файл | Стихия | Основной силуэт |
|---|---|---|
| `element_fire.webp` | Огонь | Восходящее пламя |
| `element_frost.webp` | Лёд | Шестилучевой кристалл |
| `element_venom.webp` | Яд/лес | Лист, объединённый с каплей |
| `element_storm.webp` | Буря | Вихрь и молния |
| `element_shade.webp` | Тень | Полумесяц затмения и тёмная звезда |

## Технические параметры

- Формат: прозрачный WebP.
- Размер: 128 × 128 px.
- Безопасный размер показа: 32–96 px.
- Не перекрашивать печать целиком для состояний. Выбор обозначать внешним золотым ореолом, блокировку — снижением насыщенности и отдельным замком.
- Исходники и контрольная таблица: `tmp/imagegen/element-seals/`.

## Базовый промт

> One isolated perfectly circular elemental affinity medallion for the Draconis 3.0 browser game, strict front view, thick carved outer ring, four evenly spaced scale notches, one bold central elemental silhouette, hand-painted polished fantasy mobile-game icon, chunky readable geometry, restrained detail, strong silhouette readable at 32 px, soft frontal light, isolated on a flat chroma-key background, no perspective tilt, text, letters, numbers, characters, UI panel, watermark or cast shadow.

Для каждой стихии меняются материал кольца, центральный символ и палитра. Размер кольца, четыре опорных элемента, освещение и масштаб символа сохраняются.
