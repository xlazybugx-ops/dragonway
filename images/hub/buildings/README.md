# Hub buildings P0

Подготовлено 23 июля 2026 года по `IMAGE-GENERATION-DESIGN-DOC.md`.

## Состав

- `building_lair_l1.webp` … `building_lair_l5.webp`
- `building_hatch_l1.webp` … `building_hatch_l5.webp`
- `building_explore_l1.webp` … `building_explore_l5.webp`
- `building_forge_l1.webp` … `building_forge_l5.webp`
- `building_spire_l1.webp` … `building_spire_l5.webp`
- `building_roost_l1.webp` … `building_roost_l5.webp`
- `building_codex_l1.webp` … `building_codex_l5.webp`
- `building_arena_l1.webp` … `building_arena_l5.webp`
- `building_treasury_l1.webp` … `building_treasury_l5.webp`
- `building_market_l1.webp` … `building_market_l5.webp`
- `building_decor_l1.webp` … `building_decor_l5.webp`
- `building_profile_l1.webp` … `building_profile_l5.webp`
- `construction_overlay.webp`

Портал использует пять художественных ступеней для восьми игровых уровней: `1 / 2–3 / 4–5 / 6–7 / 8`.

Все файлы имеют холст 512×512, прозрачный фон, единый нижний якорь `y=430`, ширину объекта не более 400 px. Источники и контрольные материалы находятся в `tmp/imagegen/hub-buildings-p0/` … `hub-buildings-p3/`.

## Проверка

- прозрачные углы;
- одинаковая камера и направление входа;
- наложение на лесной, лавовый и ледяной фон;
- отсутствие выхода за строительные площадки;
- читаемость L1–L5;
- автоматический fallback на старый маркер при ошибке загрузки.
