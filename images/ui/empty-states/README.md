# Иллюстрации пустых состояний

Комплект P0 из восьми иллюстраций, объясняющих отсутствие контента без тревожных или негативных образов. Иллюстрация размещается над коротким пояснением и одной основной кнопкой действия.

## Состав комплекта

| Файл | Экран и смысл | Рекомендуемое действие |
|---|---|---|
| `empty_lair.webp` | В логове пока нет драконов | Получить дракона |
| `empty_nest.webp` | В гнезде нет яйца | Найти яйцо |
| `empty_fighters.webp` | Боевой отряд не собран | Выбрать бойцов |
| `empty_artifacts.webp` | Нет найденных артефактов | Отправиться в исследование |
| `empty_breeding.webp` | Не выбрана пара для разведения | Выбрать драконов |
| `empty_codex.webp` | Раздел Кодекса ещё не открыт | Узнать, как открыть |
| `empty_rewards.webp` | Доступных наград пока нет | Посмотреть время следующей |
| `empty_connection.webp` | Соединение временно отсутствует | Повторить подключение |

## Технические параметры

- Формат: WebP с прозрачностью.
- Размер каждого файла: 512 × 512 px.
- Главный объект расположен в верхних 82% кадра; нижняя зона оставлена свободной под интерфейс.
- Рекомендуемый размер показа: 180–280 px по ширине.
- Иллюстрация не должна заменять текст причины и кнопку следующего действия.
- Исходники и контрольная таблица: `tmp/imagegen/empty-states/`.

## Общий промт серии

> Empty-state illustration for the Draconis 3.0 browser game: [DESCRIPTION]. Centered composition, subject occupies 65–70 percent of a square canvas, generous clean padding and room for two short UI text lines below. Warm hand-painted fantasy mobile-game style, rounded readable silhouette, sandstone, teal patina and restrained gold accents, inviting and actionable rather than sad, clear at small size. Isolated on a perfectly flat solid chroma-key background. No readable text, letters, numbers, UI frame, watermark, cast shadow, floor plane or background scenery.

При продолжении серии меняются только предмет и смысл состояния. Палитра, мягкий фронтальный свет, степень детализации и свободная нижняя зона сохраняются.
