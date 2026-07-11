# Драконис · Ассеты для режима «Странствия» (полёт)

Пошаговый план: что нарисовать, как назвать, куда положить. Всё опционально —
без любого файла игра рисует замену сама (процедурные карты, векторные драконы, эмодзи).

---

## Шаг 1. Карты ярусов (фоны полёта)

Главное, что даёт «нарисованный» вид. Сейчас есть только огненный мир (из демо).

**Требования к картинке:**
- Размер: **768 × 1376** (портретная, как в демо). Можно крупнее с тем же соотношением.
- Формат: **WebP** (или PNG — тогда поменять расширение в `FLY_MAPS`, файл `js/07-flight.js`).
- Вид сверху. Композиция: **низ по центру свободен** (там появляется дракон),
  **верх по центру свободен** (там стоит портал ⛩️).
- Ярус — это биом мира: 1 — окраина, 2 — глубже, 3 — сердце мира (мрачнее/ярче).

**Имена файлов** (положить в `images/`):

| Мир | Сцена | Файлы |
|---|---|---|
| Эмберрич (огонь) | fire | `fly_fire_1-3.webp` ✅ |
| Мирелот (яд) | jungle | `fly_jungle_1-3.webp` ✅ |
| Глациор (лёд) | ice | `fly_ice_1-3.webp` ✅ |
| Войдэдж (тень) | shade | `fly_shade_1-3.webp` ✅ |
| Штормпик (буря) | storm | `fly_storm_1-3.webp` ✅ |

Карты подключены по мирам (у Штормпика — свои, ключ `storm`). Все 15 карт в комплекте ✅.
Новые файлы с теми же именами подхватываются без правок кода.

## Шаг 2. Спрайты летящих драконов (вид сверху, 4 возраста)

Как у портретов, у полёта **4 стадии по уровню**: `1` (ур. 1–24), `25` (25–59),
`60` (60–99), `100` (100). Дракон в полёте растёт вместе с уровнем.

**Требования:**
- Вид строго сверху, **нос вверх кадра**, крылья расправлены.
- Прозрачный фон, PNG. Размер ~**512 px** по большей стороне (образец: `ember_fly_60.png`, 512×234).
- Возраст читается силуэтом: 1 — детёныш (короткие крылья, крупная голова),
  25 — подросток, 60 — взрослый, 100 — древний (шире размах, шипы, детали).

**Имена:** `images/{вид}_fly_{стадия}.png` — всего 15 видов × 4 возраста = **60 файлов**:

| Вид | Файлы |
|---|---|
| ember | `ember_fly_1.png` ✅ · `ember_fly_25.png` ✅ · `ember_fly_60.png` ✅ · `ember_fly_100.png` |
| glacier | `glacier_fly_1.png` · `glacier_fly_25.png` · `glacier_fly_60.png` · `glacier_fly_100.png` |
| sporewing | `sporewing_fly_1.png` · `sporewing_fly_25.png` · `sporewing_fly_60.png` · `sporewing_fly_100.png` |
| tempest | `tempest_fly_1.png` · `tempest_fly_25.png` · `tempest_fly_60.png` · `tempest_fly_100.png` |
| umbra | `umbra_fly_1.png` · `umbra_fly_25.png` · `umbra_fly_60.png` · `umbra_fly_100.png` |
| magma | `magma_fly_1.png` · `magma_fly_25.png` · `magma_fly_60.png` · `magma_fly_100.png` |
| aurora | `aurora_fly_1.png` · `aurora_fly_25.png` · `aurora_fly_60.png` · `aurora_fly_100.png` |
| voidmaw | `voidmaw_fly_1.png` · `voidmaw_fly_25.png` · `voidmaw_fly_60.png` · `voidmaw_fly_100.png` |
| cinderpup | `cinderpup_fly_1.png` · `cinderpup_fly_25.png` · `cinderpup_fly_60.png` · `cinderpup_fly_100.png` |
| permafrost | `permafrost_fly_1.png` · `permafrost_fly_25.png` · `permafrost_fly_60.png` · `permafrost_fly_100.png` |
| blightfang | `blightfang_fly_1.png` · `blightfang_fly_25.png` · `blightfang_fly_60.png` · `blightfang_fly_100.png` |
| thundercall | `thundercall_fly_1.png` · `thundercall_fly_25.png` · `thundercall_fly_60.png` · `thundercall_fly_100.png` |
| nightwyrm | `nightwyrm_fly_1.png` · `nightwyrm_fly_25.png` · `nightwyrm_fly_60.png` · `nightwyrm_fly_100.png` |
| pyrelord | `pyrelord_fly_1.png` · `pyrelord_fly_25.png` · `pyrelord_fly_60.png` · `pyrelord_fly_100.png` |
| worldserpent | `worldserpent_fly_1.png` · `worldserpent_fly_25.png` · `worldserpent_fly_60.png` · `worldserpent_fly_100.png` |

Подключение автоматическое, файлы можно добавлять постепенно: нет нужной стадии —
игра возьмёт ближайший имеющийся возраст этого вида, нет ни одного — векторного дракона.

## Шаг 3. Логова и звери

- **Логова готовы** ✅ — `den_fire.png`, `den_jungle.png`, `den_ice.png`, `den_storm.png`,
  `den_shade.png` подключены (рисуются на карте вместо эмодзи, белый фон вырезан).
- **Звери** — пока эмодзи 🐗👹. Нужны спрайты вид сверху, ~160 px, прозрачный фон
  (по 1-2 на мир). По готовности подключу правкой кода.

## Шаг 4. Преграды и предметы (пока эмодзи ⛈️ 🪙 🥚 🎁 🔑 📜 💎 ❓)

- `images/storm.png` — грозовое облако, ~300 px, полупрозрачное.
- Иконки находок ~64 px: монета, самоцвет, яйцо, сундук, ключ, свиток, загадка.

⚠️ Тоже требует правки кода по готовности. Можно менять поштучно.

## Шаг 5. Портал (пока эмодзи ⛩️ + свечение)

- `images/portal.png` (открыт) и `images/portal_locked.png` (запечатан), ~256 px,
  прозрачный фон. Свечение и пульсацию код добавит сам. Требует правки кода.

---

## Приоритет

1. **Карты ярусов** трёх миров (jungle, ice, shade) — 9 картинок, максимум эффекта, ноль правок кода.
2. **Спрайты полёта** хотя бы стартовых видов (glacier, sporewing, tempest, umbra) — ноль правок кода.
3. Логова/звери → преграды/предметы → портал — с правками кода.

Промпты для генерации — в `prompts-art.docx` (стиль тот же, вид сверху, портрет 768×1376 для карт).
