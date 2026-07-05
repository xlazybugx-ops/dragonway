# 🐉 Драконис · Кодекс Чешуи — полный дизайн-гайд

Единый документ для оформления всех визуальных элементов игры: художественное
направление, спецификации каждого типа ассетов, готовые промпты для генерации
и полные правила нейминга файлов.

---

# Часть 1. Художественное направление

## 1.1. Тон и настроение

Игра сделана для ребёнка: **добрая книжная фэнтези-сказка**. Тёплый пергамент,
свет очага, уютная магия. Драконы — друзья и питомцы, даже «злодеи» скорее
ворчливые, чем страшные.

Запрещено: кровь, раны, черепа с натуралистикой, хоррор, острые «взрослые»
силуэты, мрачная безысходность. Тьма мира теней — таинственная и бархатная,
а не пугающая.

## 1.2. Палитра (из кода игры, css-переменные)

| Роль | HEX | Переменная |
|---|---|---|
| Тёмный пергамент (фон) | `#1a1410` | `--vellum` |
| Панели | `#2b2018` / `#352718` | `--panel` / `--panel2` |
| Светлые «чернила» (текст) | `#e9dcc3` | `--ink` |
| Приглушённый текст | `#a8987a` | `--ink-dim` |
| Рамки | `#5c4326` | `--edge` |
| **Золото (акцент)** | `#d9a441` | `--gold` |
| Мягкое золото | `#b78a3a` | `--gold-soft` |
| Огонь | `#e0633a` | `--ember` |
| Лёд | `#6db4d4` | `--frost` |
| Яд | `#7fb24a` | `--venom` |
| Буря | `#b88adf` | `--storm` |
| Тень | `#cf6e8f` | `--shade` |
| Здоровье | `#c5544a` | `--hp` |
| Опыт/мана | `#5fa3c0` | `--xp` |

Любой новый арт должен «сидеть» на этой палитре: тёплая тёмная основа + золотые
акценты + чистый цвет стихии.

## 1.3. Типографика

- Заголовки: **Cinzel** (латинский капителью, «высеченный» вид).
- Текст: **Spectral** / Georgia (книжная антиква).
- В арте буквы не рисуем (генераторы портят текст) — надписи добавляет игра.

## 1.4. Техника исполнения

Единый стиль: **нарисованная детская фэнтези-иллюстрация** (storybook art),
мягкая цифровая гуашь, чёткий читаемый силуэт, лёгкий контур, тёплый рассеянный
свет. НЕ фотореализм, НЕ 3D-рендер, НЕ пиксель-арт, НЕ аниме.

## 1.5. Мастер-промпт стиля

Этот блок добавляется В КОНЕЦ каждого промпта ниже (обозначен как `[STYLE]`):

```
[STYLE] = storybook fantasy illustration for a children's game, soft digital
gouache painting, warm cozy lighting, clean readable silhouette, gentle outlines,
rich warm palette with parchment browns and golden accents (#d9a441), friendly
and kind mood, high detail but not cluttered, no text, no watermark
```

Негативный промпт (для генераторов с его поддержкой):

```
[NEG] = photorealistic, 3d render, anime, pixel art, scary, horror, blood, gore,
creepy, text, letters, watermark, signature, frame, border, human characters
```

---

# Часть 2. Ассеты и промпты

## 2.1. Портреты драконов — `{вид}_{стадия}.png`

**Назначение:** карточки, логово, бой, кодекс. Все 60 уже в игре — раздел нужен
для замены/доработки в едином стиле.

**Спецификация:** 1024×1024, PNG, прозрачный фон (или чисто-белый — игра умеет
вырезать). Дракон в 3/4, смотрит влево-вверх, занимает ~80% кадра, стоит/сидит.

**Шаблон промпта:**

```
{SPECIES}, {AGE}, three-quarter view portrait of a single dragon, full body,
centered, isolated on pure white background, [STYLE]
```

**Возрастные модификаторы `{AGE}`:**

| Стадия | Модификатор |
|---|---|
| `_1` | `baby dragon hatchling, big head and eyes, tiny wings, chubby, adorable` |
| `_25` | `young juvenile dragon, slim, playful pose, wings half-grown` |
| `_60` | `adult dragon, powerful confident stance, fully grown wings` |
| `_100` | `ancient majestic dragon, huge ornate wings, glowing markings, wise and grand, small crown-like horns` |

**Дескрипторы видов `{SPECIES}`** (используются и в 2.2):

| id | Имя | Стихия | Дескриптор |
|---|---|---|---|
| ember | Эмберлинг | 🔥 | `small friendly orange-red dragon with warm glowing scales and a flame-tipped tail, ember sparks` |
| cinderpup | Жарёныш | 🔥 | `tiny mischievous fire dragon like an ember puppy, oversized paws, torch-like tail, joyful` |
| magma | Магмарок | 🔥 | `heavy bulky lava dragon, cracked obsidian plates with glowing magma seams, slow colossus` |
| pyrelord | Пламевластец | 🔥 | `regal fire dragon lord with a crown of flames, molten gold chest, volcanic majesty` |
| glacier | Гляциар | ❄️ | `ice-blue armored dragon with translucent crystal spikes and frosty breath` |
| permafrost | Вечнолёд | ❄️ | `ancient stocky frost dragon covered in glacier ice armor, icicle beard, sleepy strength` |
| aurora | Аврорин | ❄️ | `elegant polar dragon with wing membranes glowing like aurora borealis, star-blue eyes` |
| sporewing | Спорокрыл | ☠️ | `slender swamp-green dragon with mushroom-spotted wings, spore dust trailing, curious` |
| blightfang | Гнилоклык | ☠️ | `sneaky moss-green dragon with oversized venom fangs, leaf-camouflage scales, sly grin` |
| worldserpent | Мирозмей | ☠️ | `colossal mythical serpent-dragon with world-root patterns on endless coils, primordial green-gold` |
| tempest | Темпестар | ⚡ | `violet storm dragon with lightning-pattern wings, wind-swept crest, energetic` |
| thundercall | Громозов | ⚡ | `swift storm dragon with thunder-drum chest and crackling lightning horns, dynamic pose` |
| umbra | Умбракс | 🌙 | `dusky purple shadow dragon with starry night wing membranes, soft mysterious glow` |
| nightwyrm | Сумрачник | 🌙 | `sleek cat-like night dragon with crescent moon markings and ember eyes, silent hunter` |
| voidmaw | Бездномор | 🌙 | `mythic void dragon with nebula-galaxy wings, deep-space blue-black scales, ancient beyond time` |

**Пример готового промпта** (`pyrelord_100.png`):

```
regal fire dragon lord with a crown of flames, molten gold chest, volcanic
majesty, ancient majestic dragon, huge ornate wings, glowing markings, wise and
grand, small crown-like horns, three-quarter view portrait of a single dragon,
full body, centered, isolated on pure white background, [STYLE]
```

## 2.2. Спрайты полёта — `{вид}_fly_{стадия}.png`

**Назначение:** дракон игрока в режиме «Странствия». 60 файлов (15×4).
Есть: `ember_fly_1/25/60`. Игра сама берёт ближайший возраст, если файла нет.

**Спецификация:** ~1024 px по большей стороне, PNG, прозрачный/белый фон.
**Вид строго сверху, нос ВВЕРХ кадра**, крылья расправлены симметрично.
Пропорции любые — код подстраивается.

**Шаблон промпта:**

```
{SPECIES}, {AGE}, top-down aerial view of a single flying dragon seen directly
from above, head pointing up, wings fully spread symmetrically, tail down,
isolated on pure white background, [STYLE]
```

## 2.3. Карты ярусов — `fly_{мир}_{ярус}.webp`

**Назначение:** фоны полёта. Все 15 в игре ✅ — раздел для доработки и замены.

**Спецификация:** 768×1376 (портрет; допустимо крупнее с тем же соотношением),
WebP/JPG качество 80+. Композиция: **низ-центр свободен** (точка старта),
**верх-центр свободен** (портал), интерес равномерно по карте, вид сверху
с высоты птичьего полёта.

**Шаблон:**

```
top-down fantasy game map of {LOCATION}, bird's-eye view, portrait orientation,
paths and points of interest spread evenly, empty landing clearing at bottom
center, empty shrine clearing at top center, [STYLE]
```

**`{LOCATION}` по мирам и ярусам:**

| Файл | Локация |
|---|---|
| `fly_fire_1` | `ash meadows with warm ember fields, scattered lava cracks, cozy volcanic foothills` |
| `fly_fire_2` | `rivers of glowing lava between dark basalt shores, fire geysers, obsidian bridges` |
| `fly_fire_3` | `the heart of a great volcano, ringed lava lake, molten golden glow, dramatic but not scary` |
| `fly_jungle_1` | `lush green lakes and giant leaves, friendly swamp edges, glowing flowers` |
| `fly_jungle_2` | `deep toxic marshes with turquoise pools, huge mushrooms, tangled roots` |
| `fly_jungle_3` | `the spore hive: giant luminous fungus city, green-gold haze, root labyrinth` |
| `fly_ice_1` | `snowy slopes with pine forests, frozen streams, warm winter light` |
| `fly_ice_2` | `crystal ice caverns seen from above, aquamarine glacial cracks, shimmering frost` |
| `fly_ice_3` | `the frozen abyss: deep-blue ancient ice, giant icicle towers, polar glow` |
| `fly_storm_1` | `floating cliff islands among clouds, rope bridges, wind-bent trees` |
| `fly_storm_2` | `the eye of the storm: swirling cloud spiral, lightning-lit sky islands, violet glow` |
| `fly_storm_3` | `thunder throne: colossal sky citadel on a storm peak, crackling violet energy` |
| `fly_shade_1` | `twilight edge: dusky velvet hills, glowing night flowers, first stars` |
| `fly_shade_2` | `shadow rift: floating dark isles over a soft violet abyss, moon bridges` |
| `fly_shade_3` | `the starless core: heart of gentle darkness, nebula pools, ancient shrine stones` |

## 2.4. Логова зверей — `den_{мир}.png`

**Назначение:** парящие острова-логова на картах полёта. Все 5 в игре ✅.

**Спецификация:** ~1024×560, PNG, прозрачный/белый фон. Одиночный «вырванный»
островок земли с норой/пещерой, вид сверху-сбоку (3/4 сверху), край земли рваный
с висящими корнями — остров парит.

**Шаблон:**

```
small floating island with a beast den cave, torn earth bottom edge with hanging
roots and stones, {BIOME_DETAIL}, three-quarter top view, single object isolated
on pure white background, [STYLE]
```

`{BIOME_DETAIL}`: fire → `charred rocks, ember cracks, bones of ash wood`;
jungle → `mossy stones, mushrooms, swamp grass`; ice → `snow cap, icicles under
the ledge`; storm → `wind-polished cliffs, small lightning rods of crystal`;
shade → `violet moss, glowing night blossoms, spider-silk veil`.

## 2.5. Звери логов — `beast_{мир}_{1|2}.png` *(нужен арт + правка кода)*

**Спецификация:** ~512 px, PNG, прозрачный/белый фон, вид сверху (как спрайты
полёта), 10 файлов. Звери — забавные, слегка грозные, не страшные.

| Файл | Промпт-ядро |
|---|---|
| `beast_fire_1` | `wild boar with smoldering ember bristles` |
| `beast_fire_2` | `fire salamander lizard with lava spots` |
| `beast_jungle_1` | `sly swamp fox with leafy tail` |
| `beast_jungle_2` | `grumpy moss troll, round and mossy` |
| `beast_ice_1` | `fluffy snow wolf with frost mane` |
| `beast_ice_2` | `walrus-like ice guardian with crystal tusks` |
| `beast_storm_1` | `storm hawk with lightning feathers` |
| `beast_storm_2` | `cloud ram with thundercloud wool` |
| `beast_shade_1` | `shadow spider with lantern eyes, more curious than creepy` |
| `beast_shade_2` | `night scorpion with moonstone stinger` |

Шаблон: `{CORE}, top-down view from above, single creature, cute but slightly
fierce, isolated on pure white background, [STYLE]`

## 2.6. Портал — `portal_open.png`, `portal_locked.png` *(нужен арт + правка кода)*

~512×512, PNG, прозрачный фон. Открытый: `ancient stone torii gate filled with
swirling golden portal light, floating runes`. Запечатанный: тот же, но `dim,
dormant, cold stone, faint lock rune glow, no light inside`. + `[STYLE]`, вид
сверху-3/4, одиночный объект на белом.

## 2.7. Гроза — `storm_cloud.png` *(нужен арт + правка кода)*

~600×400, PNG, прозрачный фон: `fluffy dark storm cloud seen from above with
soft violet lightning glow inside, semi-transparent edges, single object,
isolated on white, [STYLE]`

## 2.8. Иконки предметов и валют — `ui/icon_{имя}.png` *(нужен арт + правка кода)*

**Спецификация:** 256×256, PNG, прозрачный фон, крупный центральный объект
(~85% кадра), лёгкая золотая подсветка снизу. Единый ракурс 3/4.

| Файл | Объект |
|---|---|
| `ui/icon_coin.png` | `golden dragon coin with a dragon head emboss` |
| `ui/icon_gem.png` | `faceted amber-gold gemstone` |
| `ui/icon_dust.png` | `pouch spilling sparkling golden stardust` |
| `ui/icon_food.png` | `roasted meat on the bone, cartoon style, appetizing` |
| `ui/icon_egg_fire.png` | `dragon egg with ember-red speckles, warm glow` *(и по одной на стихию: `_frost`, `_venom`, `_storm`, `_shade` — цвет стихии)* |
| `ui/icon_chest_1.png` | `simple wooden chest with iron bands` |
| `ui/icon_chest_2.png` | `sturdy reinforced chest with bronze ornaments` |
| `ui/icon_chest_3.png` | `ancient ornate urn-chest with golden dragon engravings` |
| `ui/icon_key_1.png` | `simple iron key` |
| `ui/icon_key_2.png` | `carved bronze key with rune` |
| `ui/icon_key_3.png` | `ancient golden key with dragon-head bow` |
| `ui/icon_scroll.png` | `old parchment scroll with wax dragon seal` |
| `ui/icon_mystery.png` | `glowing golden question rune stone` |
| `ui/icon_star.png` | `radiant golden overlord star` |

Шаблон: `{OBJECT}, game item icon, centered, three-quarter view, soft golden
rim light, isolated on transparent background, [STYLE]`

## 2.9. Фоны экранов

| Файл | Размер | Промпт |
|---|---|---|
| `hub_bg.webp` *(есть ✅)* | 1600×960 | `cozy fantasy dragon valley at golden hour, small settlement with nest tower, forge, arena and portal shrine spread across rolling hills, birds-eye slight angle, inviting, [STYLE]` |
| `arena_fire.webp` *(опц.)* | 1600×900 | `volcanic arena ring with basalt columns and ember sky, empty center stage, [STYLE]` |
| `arena_ice.webp` | 1600×900 | `frozen arena ring with ice pillars and aurora sky, empty center, [STYLE]` |
| `arena_jungle.webp` | 1600×900 | `overgrown swamp arena with giant mushrooms and fireflies, empty center, [STYLE]` |
| `arena_shade.webp` | 1600×900 | `twilight arena among floating stones and starry mist, empty center, [STYLE]` |
| `ui/parchment.webp` *(опц. текстура панелей)* | 1024×1024 бесшовная | `seamless dark parchment paper texture, warm brown, subtle fibers, very low contrast, tileable, no vignette` |

Фоны боя сейчас рисуются SVG-сценами — файлы `arena_*` подключаются правкой кода.

## 2.10. Обложка и иконка приложения

| Файл | Размер | Промпт |
|---|---|---|
| `icon.png` (favicon/APP) | 512×512 | `friendly orange-red baby dragon head smiling, circular emblem on dark parchment with golden ring border, game app icon, bold readable at small size, [STYLE]` |
| `cover.png` (соцпревью GitHub) | 1280×640 | `young hero dragon flying over five fantasy realms (volcano, jungle, ice, storm sky, twilight isles) toward a glowing golden portal, epic but kind, wide banner composition, empty space at right third for logo, [STYLE]` |

---

# Часть 3. Полный справочник нейминга файлов

## 3.1. Общие правила

1. Только **латиница, строчные**, слова через `_` (snake_case). Без пробелов,
   кириллицы и дефисов.
2. Спрайты и иконки с прозрачностью — **PNG**; большие непрозрачные фоны — **WebP**.
3. Суффикс возраста дракона — всегда один из `1 / 25 / 60 / 100` (уровень начала стадии).
4. Суффикс яруса — `1 / 2 / 3`.
5. Ключ мира — `fire / jungle / ice / storm / shade`
   (Эмберрич / Мирелот / Глациор / Штормпик / Войдэдж).
6. Все файлы лежат в `images/`, иконки интерфейса — в `images/ui/`.
7. Белый фон допустим у исходников: перед укладкой в игру он вырезается
   (маска по белизне) — либо просите прозрачный фон сразу.

## 3.2. Сводная таблица (✅ — уже в игре, 🔧 — потребуется правка кода)

| Шаблон имени | Кол-во | Статус | Подключение |
|---|---|---|---|
| `{вид}_{стадия}.png` — портреты | 60 | ✅ все | автоматически |
| `{вид}_fly_{стадия}.png` — спрайты полёта | 60 | ✅ 3 (ember 1/25/60) | автоматически, с фолбэком возраста |
| `fly_{мир}_{ярус}.webp` — карты полёта | 15 | ✅ все | автоматически |
| `den_{мир}.png` — логова-острова | 5 | ✅ все | автоматически |
| `hub_bg.webp` — фон хаба | 1 | ✅ | автоматически |
| `beast_{мир}_{1\|2}.png` — звери | 10 | — | 🔧 |
| `portal_open.png`, `portal_locked.png` | 2 | — | 🔧 |
| `storm_cloud.png` | 1 | — | 🔧 |
| `ui/icon_*.png` — иконки предметов | ~18 | — | 🔧 |
| `arena_{сцена}.webp` — фоны боя | 4 | — | 🔧 |
| `ui/parchment.webp` — текстура панелей | 1 | — | 🔧 |
| `icon.png`, `cover.png` — обложки | 2 | — | favicon: 🔧 строка в index.html |

«Автоматически» = положить файл с правильным именем в `images/` — игра подхватит
сама, а при отсутствии файла нарисует замену (вектор/эмодзи/процедурный фон).
Ничего не ломается ни при каком наборе файлов.

## 3.3. Примеры полных имён

```
images/ember_1.png            портрет Эмберлинга-малыша
images/voidmaw_fly_100.png    древний Бездномор в полёте
images/fly_storm_2.webp       карта «Око Бури» (Штормпик, ярус 2)
images/den_jungle.png         логово-остров Мирелота
images/beast_ice_1.png        снежный волк (зверь Глациора)
images/ui/icon_chest_3.png    иконка древнего сундука
```

---

# Часть 4. Порядок работы (приоритеты)

1. **Спрайты полёта** (2.2): сначала стартовые виды — glacier, sporewing,
   tempest, umbra по 4 возраста + ember_fly_100. Максимум эффекта, ноль правок кода.
2. **Звери** (2.5) — 10 файлов, оживят логова (нужна правка кода — по готовности).
3. **Портал и гроза** (2.6–2.7) — 3 файла, финальный штрих полёта.
4. **Иконки UI** (2.8) — заменят эмодзи в полосе ресурсов и наградах.
5. **Фоны арены** (2.9) и остальные портреты — полировка.
6. **Иконка и обложка** (2.10) — к публикации на GitHub Pages.

Готовые изображения складывайте в `images_int/` — оттуда я вырезаю фон,
переименовываю по правилам и подключаю в игру.
