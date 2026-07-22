# Драконис 3.0 — графический аудит и техническое задание на недостающую UI-графику

Дата аудита: 22 июля 2026 года  
Объект: браузерная игра «Драконис 3.0 · Кодекс Чешуи»  
Назначение документа: единый рабочий план для генерации, отбора, подготовки и внедрения недостающих изображений интерфейса.

---

## 1. Итог аудита

В проекте уже сформирована сильная основа: 290 оптимизированных WebP-изображений, 60 возрастных портретов драконов, 15 текстур биомов, 50 точек интереса, 80 объектов декора, 15 дополнительных логов, 27 реликвий, фоны стартовых экранов, поселения и логова. Визуальный язык окружения в целом цельный: тёплая сказочная гуашь, округлые формы, читаемые силуэты и цветовое разделение пяти стихий.

Главная графическая проблема версии 3.0 — не нехватка фоновой живописи, а разрыв между живописным игровым миром и служебным интерфейсом. В исходниках остаётся около 230 вхождений эмодзи. Часть автоматически преобразуется в кодовые пиктограммы, но часть видна игроку как системные эмодзи конкретной платформы. Из-за этого один экран может одновременно показывать живописного дракона, плоский CSS-символ, цветной эмодзи Apple/Windows и текстовый знак. Это снижает ощущение единого мира и затрудняет мгновенное распознавание функций.

### Главные выводы

1. В первую очередь нужны не новые большие фоны, а законченный комплект UI-иконок и иллюстраций состояний.
2. Самый заметный пробел — 16 уникальных яиц: сейчас данные описывают разные яйца, но карточки и мини-игра используют процедурную или эмодзи-графику.
3. Второй пробел — проводник Велла и наглядное обучение: есть логика уроков, но нет полноценного визуального персонажа, жестов и демонстрационных накладок.
4. Поселению нужны отдельные силуэты зданий и сервисов. Невидимые кликабельные зоны на готовом фоне недостаточно хорошо объясняют, куда можно нажимать.
5. Шпиль, бой и экономика требуют единой библиотеки пиктограмм. Для них не следует генерировать десятки несогласованных картинок по одной: нужен один контактный лист и последующая нарезка.
6. Пустые, заблокированные, ошибочные и наградные состояния должны выглядеть как часть игры, а не как текстовые сообщения веб-приложения.

---

## 2. Методика и границы аудита

Проверены:

- стартовый путь: приветствие, выбор стихии, пробуждение яйца, имя дракона и поселения;
- постоянная верхняя панель и нижняя навигация;
- поселение и панель «Сегодня»;
- логово и карточка выбранного дракона;
- гнездо и ритм вылупления;
- выбор биома, полёт, точки интереса и бой из исследования;
- турнир и пошаговый бой;
- кузница, реликвии и переработка;
- гнездилище рода и генетика;
- Шпиль, древо талантов и книга дракона;
- Кодекс, легенды, вехи и советы Веллы;
- профиль, сохранение, пустые состояния, уведомления и награды;
- структура и покрытие каталога `images/`.

Встроенный локальный браузерный предпросмотр в текущей среде не смог получить доступ к статическому серверу. Поэтому выводы основаны на полной проверке разметки, стилей, логики формирования всех экранов, существующего каталога ресурсов и ранее проверенных игровых изображений. Перед окончательным утверждением графики обязателен ручной визуальный проход на четырёх целевых форматах, описанный в разделе 14.

---

## 3. Единый дизайн-код

### 3.1. Базовый стиль для всех генераций

Этот блок добавляется в начало каждого промта ниже:

```text
Draconis game UI asset, cozy hand-painted storybook fantasy, polished gouache and soft digital painting, rounded friendly silhouettes, tactile carved stone, aged brass, warm cream highlights, restrained turquoise magical glow, subtle dark-brown outline, readable at small mobile size, consistent with a family-friendly dragon sanctuary game, clean professional game production art
```

### 3.2. Общий negative prompt

Этот блок добавляется в конец каждого промта:

```text
no text, no letters, no numbers, no watermark, no logo, no signature, no photorealism, no 3D render, no glossy mobile casino style, no neon cyberpunk, no anime, no emoji, no flat clipart, no modern plastic, no excessive particles, no busy background, no cropped object, no duplicate object, no extra limbs, no black rectangular background
```

### 3.3. Палитра

- основной тёмный фон: `#1A1410`;
- панели: тёплый шоколад `#2A1D17`, пергамент `#E9D7B3`;
- интерактивный акцент: бирюза `#66D7CE`;
- награда и основной CTA: золото `#D9A441`;
- опасность: приглушённый коралл `#D46E5B`;
- подтверждение: мох `#77A765`;
- заблокированное состояние: холодный камень `#77736E`, но не простое обесцвечивание.

### 3.4. Пять стихий

| Стихия | Основные цвета | Материал и форма |
|---|---|---|
| Огонь | янтарь, алый, уголь | трещины, кованый металл, языки пламени |
| Лёд | голубой, белый, индиго | грани кристалла, иней, плавные снежные дуги |
| Яд/лес | мох, нефрит, охра | листья, споры, лозы, влажная кора |
| Буря | бирюза, фиолетовый, серебро | спирали ветра, молнии, лёгкие перья |
| Тень | чернильный, лиловый, холодное золото | полумесяцы, дым, пустоты, обсидиан |

### 3.5. Размеры и экспорт

| Тип | Мастер | Игровой экспорт |
|---|---:|---:|
| микроиконка | 512×512 | 64×64 и 96×96 WebP lossless |
| предмет/яйцо | 1024×1024 | 256×256 и 384×384 WebP lossless |
| персонаж/пустое состояние | 1536×1536 | 512×512 WebP |
| широкая накладка | 2048×1024 | 1024×512 WebP |
| полноэкранная накладка | 1536×2048 | 768×1024 WebP |

Прозрачный фон обязателен для всех объектов, кроме специально названных фоновых карточек. Безопасное поле вокруг объекта — не менее 12%. Тонкие детали должны оставаться видимыми при уменьшении до 48 px.

---

## 4. Карта существующего покрытия

### Полностью или почти полностью закрыто

- портреты 15 видов драконов на четырёх стадиях;
- фоны стартовых экранов;
- фон поселения и логова;
- центральная платформа логова;
- 15 бесшовных текстур биомов;
- общие изображения пяти биомов и пяти карт полёта;
- опасности пяти биомов и нити ветра;
- 50 точек интереса;
- 80 объектов декора четырёх каталогизированных биомов;
- 15 дополнительных логов;
- 27 изображений реликвий;
- три уровня сундуков;
- пять навигационных иконок;
- пять аркадных фонов.

### Закрыто частично

- ресурсы: монеты имеют иллюстрацию, но верхняя панель продолжает использовать символы;
- яйца: есть процедурный рисунок, но отсутствует единая библиотека уникальных изображений;
- способности: есть текстовые данные и эмодзи, но нет согласованного атласа;
- обучение: есть логика, spotlight и тексты, но нет персонажа и жестовой графики;
- поселение: есть фон и зоны нажатия, но нет отдельных активных/заблокированных маркеров зданий;
- состояния боя: логика есть, визуальный набор неполон;
- пустые состояния: присутствуют тексты и отдельные эмодзи, но нет иллюстраций.

---

## 5. Приоритет P0 — обязательные изображения до следующего публичного релиза

## 5.1. Комплект ресурсов и системных действий — 18 иконок

Назначение: верхняя панель, награды, стоимость, всплывающие сообщения, кнопки и карточки заданий.

### Общий промт контактного листа

```text
[BASE STYLE] A production-ready sprite sheet of 18 separate game UI icons on a transparent background, arranged in a strict 6 by 3 grid with generous equal spacing, identical visual weight and consistent three-quarter view: dragon-head gold coin, star dust crystal, dragon egg token, dragon roster crest, purple magic shard, ancient key, gift chest, food bowl, affection heart with tiny scale, sleep crescent, forge hammer, recycle spiral, shield, crossed claws, speed wing, health heart, lock, question/help rune. Each icon centered in its own cell, bold silhouette, warm brown outline, readable at 32 and 48 pixels. [NEGATIVE]
```

Файлы после нарезки: `ui_resource_gold.webp`, `ui_resource_dust.webp`, `ui_resource_egg.webp`, `ui_resource_dragons.webp`, `ui_resource_shard.webp`, `ui_key.webp`, `ui_gift.webp`, `ui_food.webp`, `ui_affection.webp`, `ui_rest.webp`, `ui_forge.webp`, `ui_recycle.webp`, `ui_defense.webp`, `ui_attack.webp`, `ui_speed.webp`, `ui_health.webp`, `ui_lock.webp`, `ui_help.webp`.

Требование: ресурсные иконки не должны быть похожи друг на друга только цветом. Монета — круглая и тяжёлая, пыль — россыпь кристаллов, осколок — один угловатый фрагмент, яйцо — вертикальный овал.

## 5.2. Уникальные яйца — 16 изображений

### Общая основа промта

```text
[BASE STYLE] A single collectible dragon egg, centered, full object visible, three-quarter front view, placed on a very subtle soft oval contact shadow, transparent background, thick readable silhouette, handcrafted shell material, restrained magical glow, designed for a 256 px carousel card. [EGG DESCRIPTION]. [NEGATIVE]
```

Подставить вместо `[EGG DESCRIPTION]`:

| Файл | Описание для промта |
|---|---|
| `egg_fire.webp` | warm charcoal shell with glowing orange lava cracks and a small crown of ember scales, common but alive |
| `egg_frost.webp` | pale blue shell under translucent ice facets, white frost rim and one deep-indigo frozen vein |
| `egg_venom.webp` | dark moss shell wrapped by two young vines, soft lime spores and amber swamp droplets |
| `egg_storm.webp` | blue-violet shell with silver spiral bands, tiny contained lightning between two raised ridges |
| `egg_shade.webp` | matte obsidian shell with a narrow crescent-shaped void, faint violet smoke sinking inward |
| `egg_forest.webp` | ancient bark shell covered with living leaves, tiny flower buds and warm green life glow |
| `egg_crystal.webp` | faceted transparent crystal egg, internal cyan prism light, heavy stone cradle at its base |
| `egg_royal.webp` | deep burgundy shell with aged gold scale filigree and a small natural crown ridge, dignified not luxurious |
| `egg_ancient.webp` | massive weathered stone shell with eroded runes, fossil scale impressions and one warm inner crack |
| `egg_primord.webp` | elemental shell divided naturally into fire, ice, forest, storm and shadow mineral seams around a bright core |
| `egg_ashking.webp` | black volcanic shell, molten royal crest, ash flakes drifting close to the surface, imposing silhouette |
| `egg_northward.webp` | tall white-blue shell, polar aurora trapped beneath ice, guardian horn-like ridges |
| `egg_emerald.webp` | polished emerald shell embraced by a serpent-shaped living vine, old forest gold inclusions |
| `egg_eclipse.webp` | perfectly dark shell surrounded by a thin displaced ring of pale light, subtle eclipse corona |
| `egg_stormcrown.webp` | indigo shell crowned by three silver lightning fins, rotating turquoise cloud ribbon close to shell |
| `egg_purity.webp` | warm ivory shell with five extremely subtle elemental veins converging into one clean golden star-shaped core |

Дополнительные состояния не генерировать отдельными файлами. Инкубацию показывать CSS-свечением, готовность — пульсом и тремя маленькими трещинами поверх изображения, выбор — золотой рамкой.

## 5.3. Велла и обучение — 10 изображений

Велла должна быть постоянным визуальным проводником. Образ: взрослая добрая драконица-наставница, не детёныш и не человек, изумрудно-бирюзовая чешуя, кремовые рога, небольшой золотой монокль или медальон-кодекс. Выражение спокойное, компетентное, немного озорное.

### Персонаж Велла — контактный лист из шести эмоций

```text
[BASE STYLE] Character expression sheet of the same friendly adult female dragon mentor Vella, emerald and turquoise scales, cream swept-back horns, warm amber eyes, small aged-gold codex medallion, consistent face and proportions in every pose, transparent background, six separate bust portraits in a strict 3 by 2 grid: welcoming smile, thoughtful explanation, excited discovery, gentle warning, proud congratulations, sympathetic encouragement. Clear mobile-game expressions without exaggeration, each portrait facing slightly toward the center. [NEGATIVE], no human body, no costume change, no baby dragon
```

Файлы: `tutorial_vella_welcome`, `tutorial_vella_think`, `tutorial_vella_discovery`, `tutorial_vella_warning`, `tutorial_vella_proud`, `tutorial_vella_support`.

### Жест касания

```text
[BASE STYLE] Tutorial gesture overlay: one simplified friendly cream-colored hand silhouette touching a glowing turquoise round point, two tiny golden response sparks, 55 percent opacity, transparent background, minimal details, readable over both dark and light game scenes, 1024 by 1024. [NEGATIVE]
```

### Жест перетаскивания

```text
[BASE STYLE] Tutorial gesture overlay: one simplified friendly hand at the start of a curved dotted turquoise motion trail ending in a soft arrowhead, two small warm-gold motion sparks, 55 percent opacity, transparent background, horizontal composition, 1536 by 768. [NEGATIVE]
```

### Spotlight

```text
[BASE STYLE] Soft irregular magical spotlight ring for a tutorial overlay, warm cream center edge, turquoise outer halo, three sparse golden dust accents, transparent background and transparent center, no symbol, readable on dark and light scenes, 1024 by 1024. [NEGATIVE]
```

### Стрелка Веллы

```text
[BASE STYLE] One short curved hand-painted pointing arrow made of warm golden magic with a turquoise scale-shaped arrowhead, transparent background, sparse particles, thick readable silhouette, 1024 by 512. [NEGATIVE]
```

## 5.4. Интерактивные маркеры поселения — 12 изображений

Фон поселения остаётся основным изображением. Новые объекты — прозрачные маркеры, накладываемые на соответствующие здания. Они не должны повторно рисовать весь фон.

### Промт контактного листа

```text
[BASE STYLE] A production sprite sheet of 12 separate interactive settlement location emblems on transparent background, strict 4 by 3 grid, equal scale and spacing, each emblem combines a small architectural silhouette with one unmistakable function symbol: dragon lair balcony, glowing nest with egg, expedition portal arch, friendly tournament arena, fire forge, world spire, breeding roost with two intertwined scales, codex library, treasury chest vault, market awning, decoration workshop, profile banner tower. Warm carved-stone and aged-brass construction, subtle turquoise active glow, no rectangular button backgrounds, readable at 64 px. [NEGATIVE]
```

Имена: `hub_lair`, `hub_hatch`, `hub_explore`, `hub_arena`, `hub_forge`, `hub_spire`, `hub_roost`, `hub_codex`, `hub_treasury`, `hub_market`, `hub_decor`, `hub_profile`.

Состояния создавать кодом:

- обычное — 85% непрозрачности;
- доступное действие — бирюзовый пульс;
- награда — маленький золотой бейдж `!`;
- заблокировано — каменная плашка и `ui_lock`, без снижения непрозрачности ниже 55%;
- нажатие — масштаб 0,96 на 90 мс.

## 5.5. Пустые состояния — 8 иллюстраций

Общий формат: 1024×1024, прозрачный фон, объект занимает 70–75% кадра, вокруг остаётся место для текста. Эти иллюстрации показываются только при отсутствии контента и не конкурируют с CTA.

| Файл | Полный смысловой фрагмент промта |
|---|---|
| `empty_lair.webp` | an inviting empty rounded stone dragon perch with a folded turquoise blanket, tiny warm lantern and two hopeful paw prints, no dragon |
| `empty_nest.webp` | a cozy empty nest of soft straw and broad leaves, one small glowing eggshell fragment pointing toward adventure |
| `empty_fighters.webp` | a peaceful training circle with two unused padded claw targets and a small resting banner, no characters |
| `empty_artifacts.webp` | an open relic chest lined with dark velvet, empty shaped slots and one floating dust sparkle |
| `empty_breeding.webp` | two adjacent warm stone perches connected by a gentle carved heart-scale motif, both empty |
| `empty_codex.webp` | an open cream parchment codex with softly glowing blank creature silhouette and a bookmark leading onward |
| `empty_rewards.webp` | an opened small gift box with only a warm light inside and a tiny clock-shaped charm indicating the next reward |
| `empty_connection.webp` | a sleeping tiny messenger drake beside a loosely broken turquoise magic thread, calm recoverable state, no alarm imagery |

Для каждого файла использовать общую конструкцию:

```text
[BASE STYLE] Empty-state illustration for a mobile dragon game: [DESCRIPTION], centered composition, transparent background, inviting and actionable rather than sad, room for two short UI text lines below, 1024 by 1024. [NEGATIVE]
```

---

## 6. Приоритет P1 — единая библиотека боя и развития

## 6.1. Пять стихийных печатей

```text
[BASE STYLE] Five separate circular elemental seals on transparent background in one horizontal sprite sheet: fire flame carved in volcanic brass, frost crystal carved in pale silver, venom leaf-drop carved in mossy bronze, storm spiral carved in charged silver, shadow crescent carved in obsidian gold. Identical outer ring, equal visual weight, readable at 32 px, no letters. [NEGATIVE]
```

Файлы: `element_fire`, `element_frost`, `element_venom`, `element_storm`, `element_shade`.

## 6.2. Способности Шпиля и боя — 50 иконок

Для сохранения единства генерировать пять отдельных листов по 10 иконок, один лист на стихию. У каждой стихии сохраняется один материал рамки, но меняется центральный силуэт.

### Огонь

```text
[BASE STYLE] A strict 5 by 2 sprite sheet of ten separate FIRE ability icons on transparent background, identical round volcanic-brass frames and equal scale: tiny spark, flaming claw, radial heat wave, ash vortex, lava projectile, fire storm, flame shield, rising magma core, phoenix-shaped healing flame, solar explosion. Bold simple silhouettes, orange-red core, cream-hot highlights, readable at 40 px. [NEGATIVE]
```

### Лёд

```text
[BASE STYLE] A strict 5 by 2 sprite sheet of ten separate FROST ability icons on transparent background, identical round pale-silver ice frames: snow crystal, frozen claw, slowing cold wave, frost coating, piercing ice spike, blizzard spiral, crystal armor shield, precise crystal eye, healing frozen heart, permafrost chains. Cyan-white core and deep-indigo shadows, readable at 40 px. [NEGATIVE]
```

### Яд/лес

```text
[BASE STYLE] A strict 5 by 2 sprite sheet of ten separate VENOM ability icons on transparent background, identical round mossy-bronze frames: poison splash, toxic claw, growing spore, acid drop eating armor, decaying cloud, binding vines, thorn shell, regenerating green blood leaf, spreading decay rune, abyssal poisonous blossom. Moss, lime and amber palette, readable at 40 px. [NEGATIVE]
```

### Буря

```text
[BASE STYLE] A strict 5 by 2 sprite sheet of ten separate STORM ability icons on transparent background, identical round charged-silver frames: small electric spark, lightning claw, speed gust, thunder ring, precise lightning bolt, wind barrage, electric shield, double-turn wing, healing storm heart, descending sky wrath. Turquoise, violet and white palette, readable at 40 px. [NEGATIVE]
```

### Тень

```text
[BASE STYLE] A strict 5 by 2 sprite sheet of ten separate SHADOW ability icons on transparent background, identical round obsidian-gold frames: small shadow wisp, dark claw, confusion mist, shadow double, draining void, concealing dusk veil, night shield, devouring black sun, healing violet shadow heart, eclipse. Ink, violet and pale-gold palette, readable at 40 px. [NEGATIVE]
```

Имена файлов: `ability_<element>_01.webp` … `ability_<element>_10.webp` строго в порядке данных `SPELL_POOL`. Это позволит подключить их без ручных таблиц соответствия.

## 6.3. Статусы боя — 15 иконок

```text
[BASE STYLE] A strict 5 by 3 sprite sheet of fifteen separate combat status icons on transparent background, identical small hexagonal parchment-and-brass frames: burning, frozen slow, poison stacks, stun, blind, weakened attack, broken armor, speed up, attack up, defense up, regeneration, shielded, dodge, life drain, extra turn. Each status uses a distinct shape in addition to color, clear at 28 px, restrained effects. [NEGATIVE]
```

Имена: `status_burn`, `status_slow`, `status_poison`, `status_stun`, `status_blind`, `status_atk_down`, `status_def_down`, `status_speed_up`, `status_atk_up`, `status_def_up`, `status_regen`, `status_shield`, `status_dodge`, `status_drain`, `status_extra_turn`.

## 6.4. Боевые накладки — 7 изображений

Эти элементы кратковременно накладываются поверх бойцов. Они должны быть лёгкими и полупрозрачными.

```text
[BASE STYLE] Seven separate lightweight combat effect overlays on a transparent background, wide spacing for slicing: curved claw slash, small shield impact ring, healing leaf-heart spiral, fire hit burst, ice crack burst, lightning fork burst, shadow absorption spiral. Soft painted edges, center left transparent for character readability, no frame, no text, effects occupy compact area, 50 percent translucent outer edges. [NEGATIVE]
```

Файлы: `fx_slash`, `fx_block`, `fx_heal`, `fx_fire_hit`, `fx_frost_hit`, `fx_storm_hit`, `fx_shadow_drain`.

---

## 7. Приоритет P1 — награды, прогресс и обратная связь

## 7.1. Комплект наград — 12 изображений

```text
[BASE STYLE] A strict 4 by 3 sprite sheet of twelve separate reward and progression emblems on transparent background: daily gift, three-day streak flame, protected streak shield, weekly expedition map, completed quest seal, new discovery star, level-up wreath, rare drop rays, dragon ascension star, unlocked biome gate, mastery check seal, mystery reward silhouette. Consistent aged-gold and turquoise visual language, bold silhouette, celebratory but restrained, readable at 48 px. [NEGATIVE]
```

Использование: панель «Сегодня», недельная экспедиция, тосты, экран результата боя и Кодекс.

## 7.2. Рамки редкости — 6 изображений

```text
[BASE STYLE] Six separate square collectible-item frames on transparent background in a horizontal sheet, same rounded carved-stone construction and identical inner opening, rarity progression from common warm stone, uncommon moss bronze, rare blue silver, epic violet crystal, legendary aged gold, primordial pale iridescent stone. Decoration increases gradually without changing outer dimensions, transparent center, no symbols, no text. [NEGATIVE]
```

Рамки применять к яйцам, реликвиям и наградам. Не создавать отдельные рамки для каждого типа предмета.

## 7.3. Праздничная накладка

```text
[BASE STYLE] Reusable celebration overlay frame for a mobile dragon game, transparent center occupying 72 percent of canvas, sparse warm golden dust, two soft turquoise ribbons, tiny paper stars and rounded leaf shapes only around outer edges, cozy restrained storybook gouache, no trophy, no character, does not obscure UI, 1536 by 2048 portrait master with safe landscape crop. [NEGATIVE]
```

Показывать при первом вылуплении, открытии нового вида, завершении недельной экспедиции и Восхождении. Не применять к каждой обычной награде.

---

## 8. Приоритет P2 — экраны, которым нужна дополнительная атмосфера

## 8.1. Кузница

Существующие изображения реликвий качественные, но экран остаётся панельным. Нужны три небольшие декоративные накладки:

```text
[BASE STYLE] Three separate transparent forge UI decorations with wide spacing: a low glowing stone anvil ledge for displaying one relic, a restrained arc of orange forge sparks, and a dark leather tool roll with a hammer and tongs. Front three-quarter view, warm directional light, no background, no weapon as the main subject. [NEGATIVE]
```

Файлы: `forge_anvil_slot`, `forge_sparks`, `forge_tools`.

## 8.2. Гнездилище рода

```text
[BASE STYLE] Modular dragon breeding screen decoration kit on transparent background: two separate rounded mossy stone perches facing slightly inward, one central softly glowing genetic scale spiral, one small woven nest for the future hatchling. Four objects with wide spacing for slicing, affectionate natural mood, no dragons, no text, no heart-shaped cliché. [NEGATIVE]
```

Файлы: `roost_parent_left`, `roost_parent_right`, `roost_gene_spiral`, `roost_future_nest`.

## 8.3. Шпиль

```text
[BASE STYLE] Modular magical talent-tree decoration kit on transparent background: one vertical ancient stone-and-brass spine with ten subtle attachment points, one locked node ring, one unlocked turquoise node ring, one major golden ultimate node ring, one fork connector shaped like two flowing rune paths. Five separate objects, no ability symbol inside rings, readable over dark parchment. [NEGATIVE]
```

Файлы: `spire_path`, `spire_node_locked`, `spire_node_open`, `spire_node_ultimate`, `spire_fork`.

## 8.4. Кодекс и легенды

```text
[BASE STYLE] Modular codex decoration kit on transparent background: open parchment spread with blank pages, closed emerald dragon codex with turquoise scale bookmark, rolled world-lore scroll with blank seal, milestone medallion without symbol, torn undiscovered-page silhouette. Five separate objects, aged but friendly, no writing or fake glyph text. [NEGATIVE]
```

Файлы: `codex_open`, `codex_closed`, `codex_scroll`, `codex_milestone`, `codex_unknown`.

## 8.5. Профиль и сохранение

```text
[BASE STYLE] Four separate profile and save-management illustrations on transparent background: dragon-keeper banner crest with blank ribbon, small sealed travel journal, two-way magical transfer between journal and crystal, protected archive chest with a gentle shield rune. Equal visual weight, reassuring and clear, no text, no modern floppy disk or cloud icon. [NEGATIVE]
```

Файлы: `profile_crest`, `save_journal`, `save_transfer`, `save_protected`.

---

## 9. Что не следует генерировать

Чтобы не перегружать проект и не увеличивать вес релиза, следующие элементы должны оставаться кодовыми:

- стрелки назад, закрытие, раскрытие списка, переключатели и простые галочки;
- полосы здоровья, маны, опыта и инкубации;
- рамки кнопок, вкладки, поля ввода, модальные подложки;
- точки пагинации, карусельные стрелки и разделители;
- обычные звёзды редкости внутри текста;
- геометрические фокус-рамки и состояния наведения;
- цифровые значения ресурсов;
- бейдж `!`, счётчики и проценты;
- одноцветные служебные пиктограммы, уже полностью покрытые `00-icons.js`.

Причина: эти элементы должны масштабироваться, перекрашиваться, поддерживать высокий контраст и не требовать сетевой загрузки. Для них предпочтительны CSS и существующая кодовая система иконок.

---

## 10. Аудит по экранам и рекомендуемые изменения

| Экран | Состояние | Недостающее | Решение |
|---|---|---|---|
| Приветствие | сильный фон, слабый знак яйца | единый герой шага | использовать соответствующее уникальное яйцо вместо эмодзи |
| Выбор стихии | хорошие драконы | ясные стихии | добавить пять стихийных печатей |
| Пробуждение | механика понятна после текста | визуальный ритм | яйцо, жест касания, три графические трещины |
| Имя дракона | фон достаточен | подтверждение связи | Велла welcome или маленький медальон связи |
| Поселение | атмосферный фон | видимость интерактивности | 12 маркеров мест, один активный пульс |
| «Сегодня» | структурно понятно | награды смешаны с эмодзи | комплект наград и ресурсов |
| Логово | сильная композиция | пустое состояние и настроение | `empty_lair`, три статусных иконки заботы |
| Гнездо | самый заметный пробел | 16 яиц и пустое гнездо | пакет яиц, `empty_nest`, редкостные рамки |
| Исследование | графически богато | UI поверх карты | унифицировать ресурсные и статусные иконки, не добавлять декор |
| Бой исследования | хороший фон и драконы | способности и статусы | 50 способностей, 15 статусов, 7 эффектов |
| Турнир | выбор бойцов понятен | ранги и результат | использовать наградные печати и боевые иконки |
| Кузница | сильные реликвии | место ковки | наковальня, искры, инструменты |
| Гнездилище | функционально, но абстрактно | родительские места и генетика | четыре roost-объекта |
| Шпиль | много текста и эмодзи | визуальная иерархия узлов | 50 способностей и пять деталей дерева |
| Кодекс | драконы работают хорошо | неизвестное и лор | пять codex-объектов |
| Профиль | служебный экран | тематическая связь с миром | герб, журнал, перенос, защищённый архив |
| Обучение | логика полная | лицо наставника и жест | комплект Веллы и четыре накладки |

---

## 11. Правила интеграции

### 11.1. Имена и каталог

```text
images/ui/resources/
images/ui/elements/
images/ui/abilities/
images/ui/status/
images/ui/tutorial/
images/ui/empty/
images/ui/hub/
images/ui/rewards/
images/eggs/
```

Имена только в нижнем регистре, латиницей, через подчёркивание. Суффикс масштаба не нужен, пока в проекте используется один экспорт. Версию следует задавать общей строкой запроса `?v=300`, а не именем файла.

### 11.2. Fallback

Каждый новый `<img>` обязан иметь:

- понятный `alt`, если изображение несёт смысл;
- пустой `alt`, если это чистый декор;
- `onerror` или CSS-fallback на существующую кодовую иконку;
- фиксированные `width` и `height` или `aspect-ratio`, чтобы экран не прыгал при загрузке.

### 11.3. Производительность

- микроиконка: желательно до 18 КБ;
- яйцо 256 px: до 70 КБ;
- пустое состояние 512 px: до 140 КБ;
- персонаж Велла 512 px: до 180 КБ;
- весь обязательный пакет P0: целевой бюджет до 3,5 МБ;
- весь P1: до 2,5 МБ благодаря малому размеру иконок;
- не загружать P1/P2 до открытия соответствующего экрана.

### 11.4. Доступность

- значение не кодируется только цветом;
- статусы имеют уникальные силуэты;
- важные иконки сопровождаются короткой подписью или доступным именем;
- декоративная анимация отключается при `prefers-reduced-motion`;
- мигание яркости не чаще трёх раз в секунду;
- минимальный визуальный размер смысловой иконки — 24 px, область касания — 48 px.

---

## 12. Порядок производства

### Спринт A — устранить визуальный разрыв

1. Сгенерировать контактный лист 18 системных иконок.
2. Утвердить стиль на реальном размере 32/48 px.
3. Сгенерировать все 16 яиц с одним seed/reference.
4. Подключить яйца в гнездо, старт и уведомления.
5. Сгенерировать Веллу и обучающие накладки.
6. Подключить иллюстрации восьми пустых состояний.

Результат: игрок больше не встречает эмодзи в ключевых действиях первого часа.

### Спринт B — сделать мир понятнее

1. Сгенерировать 12 маркеров поселения.
2. Проверить совпадение силуэтов с фоновыми зданиями.
3. Добавить пять стихийных печатей.
4. Подключить наградные эмблемы и рамки редкости.

Результат: поселение и прогресс читаются без изучения текста.

### Спринт C — закончить бой и развитие

1. Сгенерировать пять листов способностей.
2. Нарезать и подключить иконки строго по индексам данных.
3. Сгенерировать статусы и семь боевых накладок.
4. Обновить Шпиль и книгу дракона.

Результат: бой и развитие используют один визуальный словарь.

### Спринт D — атмосферная полировка

1. Кузница.
2. Гнездилище рода.
3. Шпиль.
4. Кодекс.
5. Профиль и сохранение.

Результат: служебные экраны ощущаются частью общего игрового пространства.

---

## 13. Контроль качества генераций

Каждый комплект проходит пять ворот:

1. **Силуэт:** объект узнаётся в чёрном виде без цвета.
2. **Размер:** смысл сохраняется при 48 px; для статуса — при 28 px.
3. **Согласованность:** одинаковая толщина обводки, угол камеры и интенсивность света внутри комплекта.
4. **Фон:** прозрачность настоящая, нет серого или чёрного прямоугольника, белого ореола и обрезанных частиц.
5. **Игровая проверка:** изображение проверяется на тёмной панели, светлом пергаменте и поверх каждого биома.

Отбраковывать результат, если:

- в листе разное число объектов или нарушена сетка;
- генератор добавил текст, руны, похожие на буквы, или цифры;
- иконка читается только благодаря цвету;
- яйцо напоминает обычный предмет или кристалл без яйцевидного силуэта;
- Велла меняет форму рогов, цвет глаз или медальон между эмоциями;
- эффект закрывает более 35% тела дракона;
- архитектурный маркер выглядит как отдельное новое здание и конфликтует с фоном поселения.

---

## 14. Матрица финальной визуальной приёмки

Проверить минимум в четырёх размерах:

| Формат | Размер | Основной риск |
|---|---:|---|
| телефон, портрет | 390×844 | перекрытие CTA, мелкие иконки, безопасные зоны |
| телефон, альбом | 844×390 | высота панелей, бой, стартовые экраны |
| планшет | 1024×1366 | чрезмерно большие пустоты, масштаб фонов |
| десктоп | 1440×900 | растяжение текстур, слишком мелкий игровой центр |

На каждом формате пройти:

1. новый профиль до первого дракона;
2. поселение и получение подарка;
3. логово с одним и несколькими драконами;
4. пустое и заполненное гнездо;
5. один полёт в каждом из пяти биомов;
6. пошаговый бой со всеми типами статусов;
7. кузницу с пустым и заполненным инвентарём;
8. гнездилище без пары и с доступной парой;
9. Шпиль на уровнях 1, 10, 50 и 100;
10. Кодекс с закрытыми и открытыми видами;
11. все уроки Веллы с включённым и отключённым уменьшением движения.

---

## 15. Definition of Done графической ревизии

Графическая ревизия считается завершённой, когда:

- ни одно ключевое действие первого часа не использует платформенный эмодзи;
- все 16 типов яиц визуально различимы;
- Велла сохраняет один образ во всех уроках;
- интерактивные места поселения видимы без угадывания;
- способности и статусы узнаются по форме, а не только по цвету;
- у всех основных разделов есть тематическое пустое состояние;
- новые изображения не ломают экран при ошибке загрузки;
- общий вес изображений остаётся ниже 50 МБ либо старые ресурсы дополнительно оптимизированы;
- пройдена матрица четырёх форматов;
- контактный лист каждого набора сохранён отдельно от игровых нарезанных файлов и не попадает в релиз;
- автоматическая проверка не находит PNG, резервные копии, битые ссылки и неиспользуемые производственные мастера.

---

## 16. Сводный объём работ

| Пакет | Количество игровых файлов | Приоритет |
|---|---:|---|
| ресурсы и действия | 18 | P0 |
| уникальные яйца | 16 | P0 |
| Велла и обучение | 10 | P0 |
| поселение | 12 | P0 |
| пустые состояния | 8 | P0 |
| стихийные печати | 5 | P1 |
| способности | 50 | P1 |
| статусы боя | 15 | P1 |
| боевые эффекты | 7 | P1 |
| награды | 12 | P1 |
| рамки редкости | 6 | P1 |
| праздничная накладка | 1 | P1 |
| кузница | 3 | P2 |
| гнездилище | 4 | P2 |
| Шпиль | 5 | P2 |
| Кодекс | 5 | P2 |
| профиль/сохранение | 4 | P2 |
| **Всего** | **181** | — |

Число 181 не означает 181 отдельных запусков генератора. Комплект собирается примерно за 22 согласованных генерации: индивидуально 16 яиц и несколько крупных иллюстраций, остальные элементы — контактными листами с последующей нарезкой и проверкой.
