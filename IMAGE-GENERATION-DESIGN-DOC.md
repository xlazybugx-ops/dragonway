# Draconis 3.0 — дизайн-документ генерации графики

Восстановлено: 22 июля 2026 года.  
Статус документа: рабочий источник истины для продолжения генерации.

## 1. Цель

Создать цельную библиотеку растровой игровой графики для браузерной игры «Драконис 3.0 · Кодекс Чешуи». Все изображения должны ощущаться частью одного уютного драконьего заповедника, хорошо читаться на телефоне и не дублировать элементы, которые лучше реализовать кодом.

Основной подробный аудит: `GRAPHIC-AUDIT-AND-MISSING-UI-ASSETS-2026.md`.

## 2. Единый визуальный язык

### Базовый стиль

```text
Draconis game UI asset, cozy hand-painted storybook fantasy, polished gouache and soft digital painting, rounded friendly silhouettes, tactile carved stone, aged brass, warm cream highlights, restrained turquoise magical glow, subtle dark-brown outline, readable at small mobile size, consistent with a family-friendly dragon sanctuary game, clean professional game production art
```

### Палитра

| Роль | Цвет |
|---|---|
| основной тёмный фон | `#1A1410` |
| тёплая панель | `#2A1D17` |
| пергамент | `#E9D7B3` |
| интерактивная магия | `#66D7CE` |
| награда и основной CTA | `#D9A441` |
| опасность | `#D46E5B` |
| подтверждение | `#77A765` |
| заблокированное состояние | `#77736E` |

### Стихии

| Стихия | Цвета | Материал и форма |
|---|---|---|
| огонь | янтарь, алый, уголь | трещины, ковка, восходящее пламя |
| лёд | голубой, белый, индиго | кристалл, иней, снежные дуги |
| яд/лес | мох, нефрит, охра | листья, споры, лозы, влажная кора |
| буря | бирюза, фиолетовый, серебро | вихри, молнии, лёгкие перья |
| тень | чернильный, лиловый, холодное золото | затмение, дым, обсидиан |

### Общие ограничения

```text
No readable text, letters, numbers, watermark, signature, modern plastic UI, photorealism, anime, horror, gore, aggressive spikes, noisy background, cropped object, accidental duplicate, inconsistent camera angle, thin unreadable details or emoji styling.
```

- Смысл иконки должен читаться по силуэту, а не только по цвету.
- Основной объект полностью помещается в кадр и имеет безопасные поля.
- Для одного комплекта сохраняются камера, масштаб, толщина обводки и свет.
- На игровых файлах нет подписей, букв, цифр и водяных знаков.
- Контактные листы хранятся только в `tmp/imagegen/`, не в релизном каталоге.

## 3. Технический процесс

1. Генерировать мастер в высоком разрешении на плоском хромакей-фоне.
2. Предпочтительный ключ — `#00FF00`; для зелёных объектов использовать `#FF00FF`.
3. Фон должен быть абсолютно однотонным: без пола, тени, градиента и свечения.
4. Удалить хромакей с мягкой матовой кромкой и despill.
5. Проверить прозрачные углы, отсутствие цветного ореола и обрезанных деталей.
6. Нарезать лист строго по сетке, затем обрезать по видимому содержимому.
7. Разместить объект по центру квадратного холста с одинаковым внутренним полем.
8. Экспортировать игровой файл в прозрачный WebP.
9. Сохранить источник, keyed-версию и контрольный лист в `tmp/imagegen/<pack>/`.
10. Добавить README пакета и запустить `tests/run-tests.ps1`.

### Рекомендуемые размеры

| Тип | Мастер | Игровой экспорт |
|---|---:|---:|
| малая UI-иконка | 512×512 | 128×128 WebP |
| яйцо или предмет карточки | 1024×1024 | 512×512 WebP |
| пустое состояние | 1024×1024 | 512×512 WebP |
| крупная сцена обучения | 1536×1536 | 768×768 WebP |

## 4. Восстановленная история

Статусы различаются намеренно:

- **интегрировано** — лежит в `images/`, имеет README и прошло релизную проверку;
- **подготовлено** — финальные WebP готовы, но ещё не подключены к игре;
- **мастер готов** — генерация завершена, нужна очистка/нарезка/экспорт;
- **не начато** — нет подтверждённого мастера.

| Комплект | Количество | Статус | Расположение |
|---|---:|---|---|
| ресурсы и системные действия | 18 | интегрировано | `images/ui/system/` |
| уникальные яйца | 16 | интегрировано | `images/eggs/` |
| Велла и обучение | 10 | интегрировано | `images/ui/tutorial/` |
| маркеры поселения | 12 | интегрировано | `images/ui/hub/` |
| пустые состояния | 8 | интегрировано | `images/ui/empty-states/` |
| стихийные печати | 5 | интегрировано | `images/ui/elements/` |
| наградные эмблемы | 12 | интегрировано | `images/ui/rewards/` |
| рамки редкости | 6 | подготовлено | `images/ui/rarity/` |
| огненные способности | 10 | подготовлено | `images/ui/abilities/` |
| ледяные способности | 10 | подготовлено | `images/ui/abilities/` |
| способности яда и природы | 10 | подготовлено | `images/ui/abilities/` |
| способности бури | 10 | подготовлено | `images/ui/abilities/` |
| способности тени | 10 | подготовлено | `images/ui/abilities/` |
| ультимативные способности | 10 | подготовлено | `images/ui/abilities/` |
| базовые атаки и защита | 11 | подготовлено | `images/ui/abilities/` |
| общие перки | 10 | подготовлено | `images/ui/abilities/` |

Последний подготовленный комплект — рамки редкости. Горизонтальный лист из шести рангов создан, очищен от хромакея, нарезан в прозрачные файлы 256×256 и проверен на прозрачность углов и центрального окна. До подключения к карточкам рамки имеют статус «подготовлено».

## 5. Уже созданные яйца

Готовые игровые файлы находятся в `images/eggs/`; исходники и контрольный лист — в `tmp/imagegen/eggs/`:

```text
egg_fire.webp
egg_frost.webp
egg_venom.webp
egg_storm.webp
egg_shade.webp
egg_ancient.webp
egg_ashking.webp
egg_crystal.webp
egg_eclipse.webp
egg_emerald.webp
egg_forest.webp
egg_northward.webp
egg_primord.webp
egg_purity.webp
egg_royal.webp
egg_stormcrown.webp
```

Перед интеграцией сверить имена с данными игры. Не переименовывать наугад: идентификатор файла должен точно соответствовать ключу яйца в JavaScript.

## 6. Текущий пакет — наградные эмблемы

### Порядок сетки 4×3

Слева направо, сверху вниз:

1. ежедневный подарок;
2. серия из трёх дней;
3. защищённая серия;
4. недельная экспедиция;
5. выполненное задание;
6. новое открытие;
7. повышение уровня;
8. редкая добыча;
9. восхождение дракона;
10. открытый биом;
11. мастерство;
12. таинственная награда.

### Восстановленный промт

```text
Use case: stylized-concept
Asset type: production sprite sheet for the Draconis 3.0 browser game UI
Primary request: Create a strict 4 columns by 3 rows contact sheet containing exactly twelve separate reward and progression emblems, ordered left-to-right and top-to-bottom: daily gift box; three-day streak flame; protected streak shield; weekly expedition rolled map; completed quest wax seal with a check-shaped pictogram but no letters; new discovery eight-point star; level-up laurel wreath with an upward chevron but no number; rare drop radiating gem; dragon ascension winged star; unlocked biome stone gate; mastery round seal with a simple check-shaped pictogram; mystery reward covered silhouette with an abstract curl but no typographic glyph.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, uniform edge to edge.
Style/medium: cozy hand-painted storybook fantasy, polished gouache and soft digital painting, rounded friendly silhouettes, tactile carved stone and aged brass, warm cream highlights, restrained turquoise magical glow, subtle dark-brown outline, clean professional family-friendly mobile game production art.
Composition/framing: exact equal-size 4x3 grid, generous equal gutters, one centered emblem per cell, identical visual weight and camera angle, every emblem fully visible and isolated, bold silhouette readable at 48 px.
Color palette: aged gold #D9A441, turquoise #66D7CE, warm chocolate outline, restrained cream highlights.
Constraints: exactly twelve emblems; preserve the requested order; strong shape differences not color-only; consistent scale and lighting; no overlap; no cropped objects; no cast shadows; background must remain one uniform chroma green.
Avoid: readable text, letters, numbers, captions, labels, UI panels, extra emblems, dragons or characters, photorealism, thin details, background texture, watermark, signature.
```

### План экспорта

```text
reward_daily.webp
reward_streak.webp
reward_streak_protected.webp
reward_expedition.webp
reward_quest_complete.webp
reward_discovery.webp
reward_level_up.webp
reward_rare_drop.webp
reward_ascension.webp
reward_biome_unlock.webp
reward_mastery.webp
reward_mystery.webp
```

Экспорт: 128×128, прозрачный WebP, одинаковая визуальная масса. Мастер-лист оставить отдельно.

## 7. Подготовленный пакет — рамки редкости

### Состав

1. common — тёплый камень;
2. uncommon — мшистая бронза;
3. rare — синее серебро;
4. epic — фиолетовый кристалл;
5. legendary — состаренное золото;
6. primordial — светлый иридисцентный камень.

### Промт

```text
Draconis game UI asset, cozy hand-painted storybook fantasy, polished gouache and soft digital painting. A strict horizontal sprite sheet of exactly six separate square collectible-item frames on a perfectly flat solid #00ff00 chroma-key background. All six frames have the same rounded carved construction, identical outer dimensions, identical transparent inner opening and front-facing camera. From left to right: common warm stone, uncommon moss bronze, rare blue silver, epic violet crystal, legendary aged gold, primordial pale iridescent stone. Ornamentation increases gradually without changing frame dimensions or inner opening. Bold readable silhouette for mobile UI, subtle dark-brown outline, restrained turquoise accents only where appropriate. No item inside, no text, letters, numbers, symbols, characters, extra frames, cast shadows, cropped corners, watermark or background texture.
```

Имена экспорта:

```text
rarity_common.webp
rarity_uncommon.webp
rarity_rare.webp
rarity_epic.webp
rarity_legendary.webp
rarity_primordial.webp
```

Экспорт завершён: 22 июля 2026 года. Игровые файлы находятся в `images/ui/rarity/`, мастер и контрольный лист — в `tmp/imagegen/rarity-frames/`. Следующий пакет генерации — пять стихийных листов способностей, всего 50 иконок.

Первый лист способностей, `FIRE SHEET`, завершён 22 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-fire/`. Следующий лист — `FROST SHEET`.

Второй лист способностей, `FROST SHEET`, завершён 23 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-frost/`. Следующий лист — `VENOM SHEET`.

Третий лист способностей, `VENOM SHEET`, завершён 23 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-venom/`. Следующий лист — `STORM SHEET`.

Четвёртый лист способностей, `STORM SHEET`, завершён 23 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-storm/`. Обрезанный верх финального небесного удара исправлен до экспорта. Следующий лист — `SHADE SHEET`.

Пятый лист способностей, `SHADE SHEET`, завершён 23 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-shade/`. Все пять стихийных листов завершены — всего 50 иконок. Следующий пакет — 10 ультимативных способностей из раздела 13.3.

Лист ультимативных способностей завершён 23 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-ultimate/`. Всего подготовлено 60 иконок способностей. Следующий пакет — 11 базовых атак и защиты из раздела 13.4.

Лист базовых атак и защиты завершён 23 июля 2026 года: одиннадцать прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-attacks/`. Использована сетка 4×3 с пустой последней ячейкой; белые разделители мастера исключены при экспорте. Следующий пакет — 10 общих перков из раздела 13.5.

Лист общих перков завершён 23 июля 2026 года: десять прозрачных иконок 128×128 находятся в `images/ui/abilities/`, мастер и контрольный лист — в `tmp/imagegen/abilities-perks/`. Порядок соответствует `PERK_POOLS`. В каталоге подготовлена 81 иконка способностей и боевых действий. Следующий пакет — 15 боевых статусов из раздела 14.1.

## 8. Очередь после рамок

1. Интегрировать 16 готовых яиц и заменить процедурную/эмодзи-графику.
2. Завершить 12 наград и подключить к панели «Сегодня», тостам и результатам.
3. Подключить 6 подготовленных рамок редкости к карточкам яиц, реликвий и наград.
4. Создать 5 листов способностей — всего 50 иконок.
5. Создать 15 боевых статусов.
6. Создать 7 боевых эффектов: slash, block, heal, fire hit, frost hit, storm hit, shadow drain.
7. Создать праздничную накладку.
8. Выполнить атмосферные пакеты: кузница, гнездилище, Шпиль, Кодекс, профиль.

## 9. Ворота качества

Каждый комплект принимается только если:

1. силуэты узнаются в чёрном виде без цвета;
2. смысл сохраняется при 48 px, для статусов — при 28 px;
3. камера, обводка и освещение согласованы внутри пакета;
4. фон действительно прозрачный, без серого прямоугольника и цветной каймы;
5. нет случайного текста, псевдорун, цифр и лишних объектов;
6. объект не обрезан и не касается краёв;
7. файл проверен на тёмной панели, светлом пергаменте и пяти биомах;
8. общий вес `images/` остаётся ниже 50 МБ либо старые ресурсы дополнительно оптимизированы;
9. релизные тесты проходят без битых ссылок и производственных PNG.

## 10. Правило продолжения

Перед новой генерацией сначала проверить `tmp/imagegen/` и соответствующий каталог `images/`. Не создавать повторно то, что уже имеет пригодный мастер. Продолжать с первого незакрытого статуса в таблице истории; после каждого пакета обновлять эту таблицу, README пакета и журнал изменений.

## 11. Поселение — здания и сооружения

### 11.1. Что действительно имеет уровни в коде

- Логово: 5 уровней, вместимость 4/6/8/10/12 драконов.
- Портал странствий: 3 уровня.
- Остальные здания сейчас имеют одно игровое состояние и открываются прогрессом. Для них подготовлена пятиступенчатая художественная шкала, но она не должна ошибочно отображать несуществующую механику до добавления уровней в данные.

### 11.2. Общий промт здания

```text
Use case: stylized-concept
Asset type: modular settlement building for the Draconis 3.0 island hub
Primary request: one isolated [BUILDING], visual level [LEVEL 1–5], designed to occupy an existing settlement construction field without repainting the landscape
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for removal; no scenery
Style/medium: cozy hand-painted storybook fantasy, polished gouache and soft digital painting, rounded family-friendly silhouette, carved warm sandstone, dark oak, aged brass, restrained turquoise dragon magic, subtle dark-brown outline
Camera: fixed three-quarter top-down orthographic game camera, 42-degree elevation, front entrance facing lower-right, no perspective exaggeration
Composition: entire building visible, centered over a compact oval footprint, 12 percent safe padding, base width remains consistent across all levels
Lighting: warm late-afternoon key light from upper-left, cool turquoise bounce from magical details, soft ambient occlusion only on the object
Integration: grass-edge footprint uses muted olive and warm earth matching hub_bg.webp; no separate sky, mountain, cliff, road or horizon
Constraints: the next level adds height, craftsmanship and ceremonial importance while preserving the same foundation, entrance direction, main silhouette family and landscape scale
Avoid: readable text, letters, numbers, flags with symbols, giant detached platforms, modern architecture, photorealism, anime, horror, sharp hostile spikes, excessive particles, cast shadow, floor plane, cropped roof, watermark
```

### 11.3. Универсальная шкала величия

| Уровень | Добавить к базовому промту |
|---:|---|
| 1 | humble functional outpost, one main volume, rough sandstone, timber braces, one warm lantern, minimal magic, widest part no larger than the placement footprint |
| 2 | established building, reinforced stone base, finished roof, two brass fittings, one restrained turquoise rune, slightly taller but identical entrance and footprint |
| 3 | respected sanctuary structure, second architectural tier, carved dragon-scale trim, balanced side wings, stronger lantern rhythm, controlled magical core, no footprint expansion beyond 6 percent |
| 4 | grand regional landmark, elegant vertical crown, master masonry, aged-gold details, two small flying buttresses or towers, richer but still landscape-scaled, footprint expansion below 10 percent |
| 5 | legendary seat of the sanctuary, majestic vertical silhouette, ceremonial dragon crest without lettering, luminous turquoise heart, refined gold and crystal accents, maximum detail concentrated near the roof, foundation and paths unchanged |

### 11.4. Предметные блоки зданий

Добавлять один блок после общего промта и блока уровня.

| ID и файлы | Подробный предметный блок |
|---|---|
| `lair`, `building_lair_l1…l5.webp` | a welcoming cliffside dragon lair built around a broad arched cave mouth; two rounded resting balconies, warm inner hearth, scale-shaped lintel, ventilation openings large enough for dragons; progression adds balcony tiers, carved columns, protective wing-shaped roof and finally a luminous sanctuary crown; never close or narrow the cave entrance |
| `explore`, `building_explore_l1…l3.webp` | a circular expedition portal of ancient stone with a walkable lower threshold, three stabilizing pylons and a turquoise vertical gateway; progression adds calibrated brass rings, cartographer instruments and a taller controlled energy arch; the portal remains transparent through its center and never becomes a solid tower |
| `hatch`, `building_hatch_l1…l5.webp` | a warm hatchery pavilion with a visible bowl-shaped nest chamber, broad leaf-and-tile roof, gentle heating crystals and sheltered entrance; progression adds incubation alcoves, ringed chimney vents, keeper galleries and a ceremonial egg-shaped skylight; nurturing rather than temple-like |
| `forge`, `building_forge_l1…l5.webp` | a compact dragon-fire forge with low stone walls, broad copper chimney, glowing but contained furnace mouth, exterior anvil ledge and tool rack; progression adds bellows towers, heat shields, masterwork brass flues and a crowned volcanic chimney; no weapon is the main subject |
| `roost`, `building_roost_l1…l5.webp` | a lineage roost formed by two symmetrical sheltered perches joined around a central family-tree stone, woven nesting material, gentle heart-scale motif; progression adds genealogy arches, paired observation towers and a luminous ancestral canopy; preserve two clearly separate parent places |
| `spire`, `building_spire_l1…l5.webp` | a slender cosmology spire with a stable broad base, ascending open rings and restrained violet-turquoise light; progression adds observatory balconies, floating but physically tethered rings, brass astrolabe components and a star-crowned apex; vertical but never taller than the island composition can contain |
| `codex`, `building_codex_l1…l5.webp` | a cave-library and archive with an open-book stone entrance, dry sheltered shelves, warm reading lamps and one turquoise memory crystal; progression adds scholar alcoves, scroll galleries, dragon-head bookends and a domed archive lantern; no readable writing on books or signs |
| `arena`, `building_arena_l1…l5.webp` | a friendly circular training arena with padded stone ring, two opposing entrances, low spectator steps and safety banners without symbols; progression adds judging pavilion, carved champion posts, protective rune rail and ceremonial crown lights; never resemble a lethal colosseum |
| `treasury`, `building_treasury_l1…l5.webp` | a stout rounded treasury with one heavy arched door, visible brass locking bands, two small guarded windows and a modest dragon-hoard motif; progression adds layered vault rings, keywork mechanisms, gem-lit cornice and a prestigious but compact crown; trustworthy, not sinister |
| `market`, `building_market_l1…l5.webp` | an open-air dragon keepers market under layered canvas and scale-tile awnings, three clear stalls, baskets and hanging lanterns; progression adds permanent stone counters, covered arcade, brass trade bell and elegant central roof; no readable shop signs |
| `decor`, `building_decor_l1…l5.webp` | a landscape workshop and garden shed with racks for lanterns, banners, pots and small statues, open worktable and planting bed; progression adds artisan veranda, sample garden, crane for ornaments and tasteful exhibition canopy; keep objects subordinate to the building |
| `profile`, `building_profile_l1…l5.webp` | a keepers guild hall with shield-shaped doorway, archive chest, travel journal lectern and protected save crystal; progression adds heraldic balcony, record tower, secure transfer chamber and ceremonial crest; crest contains no letters or logos |

### 11.5. Контроль целостности острова

- Все варианты проверять поверх `hub_bg.webp` при масштабе 18–24% ширины сцены.
- Основание каждого уровня совмещается пиксельно; менять разрешено верхние 70% силуэта.
- Здание не закрывает соседнюю дорогу, слот украшения или более 8% соседней площадки.
- Магическое свечение не ярче портала фона и не образует отдельный источник погоды.
- Уровни 4–5 добавляют величие вертикально, а не превращают остров в плотный город.

## 12. Летающие драконы сверху — 15 видов × 4 возраста

### 12.1. Общий промт

```text
Use case: stylized-concept
Asset type: top-down flying dragon sprite for exploration and turn-based battle in Draconis 3.0
Primary request: one [SPECIES] at [AGE STAGE], flying straight toward the top edge of the canvas
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, uniform edge to edge
Style/medium: polished hand-painted fantasy mobile-game sprite, soft gouache texture, rounded readable anatomy, species-accurate silhouette, family-friendly, consistent with existing Draconis dragon portraits
Camera: near-orthographic view from directly above, 82–90 degree elevation; only a slight view of the forehead and shoulders, never side view or three-quarter portrait
Pose: wings in a neutral middle downstroke, left and right wings equally extended, spine aligned vertically, head at top, tail at bottom, legs tucked close to body, full silhouette visible
Composition: centered in a 512×512 square, body center fixed at 50/48 percent, total wing span 72–78 percent, total nose-to-tail length 78–84 percent, 12 percent transparent safe margin
Lighting: soft neutral light from upper-left, restrained elemental rim light, no environment reflection
Animation compatibility: clean separated wing silhouette, no particles crossing the outline, pose suitable for CSS bobbing and mirroring in battle
Constraints: preserve defining horns, head shape, wing construction, tail tip and elemental anatomy of the named species; increasing age changes proportions and authority without changing identity
Avoid: ground, contact shadow, cloud, scenery, aura field, attack effect, rider, saddle, armor, text, UI frame, cropped wing, foreshortened side pose, duplicated limbs, asymmetrical accidental anatomy, watermark
```

### 12.2. Возрастные модификаторы

| Стадия | Добавить к промту |
|---:|---|
| 1 | hatchling/young juvenile; head 22% of body length, short rounded snout, large clear wings with soft membranes, compact torso, short horns and tail, curious energetic posture; cute but anatomically capable of flight |
| 25 | adolescent; head 18% of body length, longer torso and tail, confident wing span, first complete horn silhouette and species markings, athletic rather than bulky |
| 60 | mature adult; head 15% of body length, powerful shoulders, broad load-bearing wings, full horns and tail weapon, controlled symmetrical flight, recognizably formidable but not monstrous |
| 100 | ancient apex form; same species foundation and center of mass, majestic broad wings, refined crown/horns, layered scales and restrained elemental channels, strongest silhouette in the family; added detail concentrated along spine and wing roots, not on outer edge |

### 12.3. Видовые блоки

| ID | Предметный блок |
|---|---|
| `ember` | Emberling, small fire dragon with rounded wedge head, two backward ember horns, compact bat-like wings, warm orange scales, charcoal wing membranes, glowing ember line down the spine and a leaf-shaped flame tail tip |
| `cinderpup` | Cinderpup, agile puppy-like fire dragon with broad playful head, short swept ears/horns, long narrow wings, bright copper scales, soot-dark paws and a torch-like flexible tail |
| `magma` | Magmarok, heavy volcanic dragon with broad armored shoulders, short thick neck, rock-plate wings with glowing membrane cracks, dark basalt scales, lava seams and blunt mace tail |
| `pyrelord` | Pyrelord, regal fire dragon with crown-like swept horns, long triangular wings, deep crimson and black scales, symmetrical golden fire channels and spear-shaped burning tail fan |
| `glacier` | Glaciar, streamlined ice dragon with narrow diamond head, paired crystal horns, long translucent frost wings, pale blue scales, indigo spine and split icicle tail |
| `permafrost` | Permafrost, massive defensive ice dragon with broad shield head, layered glacier plates, short powerful crystalline wings, white-indigo shell and heavy frozen hammer tail |
| `aurora` | Aurorin, elegant polar dragon with antler-like crystal crown, long ribbon wings, pearl scales washed with cyan and violet aurora bands, luminous flowing tail fins |
| `sporewing` | Sporewing, light forest dragon with leaf-shaped head frill, broad moth-like wings patterned as veins, moss-green body, amber spores held close to wing roots and curled vine tail |
| `blightfang` | Blightfang, low predatory venom dragon with narrow serpent head, hooked jaw fins, torn-leaf wings, dark wet green scales, ochre toxin glands and barbed thorn tail |
| `worldserpent` | World Serpent, ancient long-bodied forest dragon, narrow crowned head, enormous root-and-leaf wings attached to serpentine torso, jade scales, gold world-ring markings and long forked vine tail |
| `tempest` | Tempestar, swift storm dragon with falcon-like head, swept silver horns, feather-membrane hybrid wings, violet body, turquoise lightning channels and forked aerodynamic tail |
| `thundercall` | Thundercall, muscular thunder dragon with hammer-shaped head crown, broad jagged wings, deep purple scales, silver conductor plates and a lightning-bolt tail blade |
| `umbra` | Umbrax, compact shadow dragon with bat-like head, crescent horns, broad velvet wings, ink-black violet scales, cold-gold eye accents and crescent tail tip; silhouette remains readable without black fog |
| `nightwyrm` | Nightwyrm, lean feline shadow dragon with narrow ears/horns, long silent wings, charcoal-lilac scales, subtle moon spots and whip tail ending in a dark star fin |
| `voidmaw` | Voidmaw, mythic abyss dragon with broad circular jaw silhouette, obsidian crown horns, huge manta-like wings, ink-violet armor, restrained cold-gold void channels and long eclipse-ring tail |

### 12.4. Матрица файлов

Для каждого ID выше экспортировать четыре файла:

```text
{id}_1_top.webp
{id}_25_top.webp
{id}_60_top.webp
{id}_100_top.webp
```

Итого 60 файлов в `images/flight/`. Код уже ищет их по виду и фактическому уровню в исследовании и сражении. Если файл отсутствует, используется стихийный WebP, затем кодовый SVG.

## 13. Иконки древа способностей и атак

### 13.1. Общий контракт иконки

```text
Use case: stylized-concept
Asset type: production ability icon for the Draconis 3.0 talent tree and battle controls
Primary request: exactly one [ABILITY SUBJECT], no character portrait
Style/medium: hand-painted fantasy game icon, polished gouache, bold compact silhouette, tactile elemental material, restrained glow, dark-brown outline, readable at 32 and 48 px
Composition: centered single symbol, front view or controlled three-quarter view, fills 68–74 percent of a square, 14 percent safe padding, no frame because rarity/state frames are applied separately
Lighting: consistent soft frontal light with one elemental rim
Background: perfectly flat chroma-key field for removal
Constraints: meaning must remain recognizable in grayscale; distinct shape, not color-only; one action and one focal object
Avoid: text, letters, numbers, pseudo-runes, UI panel, character, full dragon, landscape, multiple unrelated objects, thin filigree, cropped particles, watermark
```

### 13.2. Пять листов заклинаний — по 10 иконок

Каждый лист: строгая сетка 5×2, порядок слева направо по данным `SPELL_POOLS`. После нарезки имя: `ability_{element}_{01…10}.webp`.

```text
FIRE SHEET — exactly ten separate icons: tiny rising spark; flaming claw slash; expanding heat wave ring; spiraling ash cyclone; dense lava projectile; descending fire meteor storm; curved flame shield; cracked magma core growing brighter; phoenix-shaped healing flame; compact solar explosion. Amber, scarlet and charcoal materials; every silhouette different.

FROST SHEET — exactly ten separate icons: six-point snow crystal; ice-coated claw slash; descending freezing mist; spreading frost fern; armor-piercing ice spike; circular blizzard; faceted ice shield; crystal eye lens; blue heart inside a snow halo; glacier fissure locking shut. Cyan, white and indigo materials.

VENOM SHEET — exactly ten separate icons: venom splash droplet; thorned toxic claw; mushroom spore pod; acid flask-shaped droplet without glass label; low poison cloud; binding crossed vines; thorn canopy shield; green heart fed by a toxin drop; decaying leaf spiral; abyssal flower bursting spores. Moss, jade and ochre materials.

STORM SHEET — exactly ten separate icons: small forked charge; lightning claw; curved wind gust; concentric thunder shockwave; precise vertical lightning bolt; compact tornado; conductor shield with electric rim; wing-shaped speed streak; violet heart struck by gentle lightning; star-shaped heavenly thunder strike. Turquoise, violet and silver materials.

SHADE SHEET — exactly ten separate icons: small crescent shadow; dark claw cut; blurred eclipse mask without a face; paired shadow silhouettes; absorbing black well with inward arrows; protective dusk veil; crescent night shield; light being drawn into an obsidian shard; violet heart in a dark halo; complete eclipse with weakening rays. Ink, lilac and cold gold materials.
```

### 13.3. Ультимативные способности — 10

Строгий лист 5×2, по два символа каждой стихии. Имя: `ultimate_{element}_{01|02}.webp`.

```text
Exactly ten separate ultimate ability emblems: volcanic eruption column; crowned solar wrath; glacier splitting downward; radiant heart of winter; plague cyclone; world tree with healing root and poisonous crown; thousand converging lightning bolts; colossal hand-shaped cloud striking downward; starless night sphere swallowing light; void heart combining inward damage rays and outward healing ring. More ceremonial than normal abilities, aged-gold anchor details, still readable at 48 px, no text or frame.
```

### 13.4. Базовые атаки и защита — 11

Имена: `attack_fire_basic`, `attack_fire_heavy`, аналогично для пяти стихий, плюс `attack_guard`.

```text
Strict contact sheet of eleven battle action icons: fire breath projectile; dense ember volley; straight ice spike; circular blizzard; venom fang bite; spore burst; precise thunder discharge; branching lightning storm; shadow claw; absorbing eclipse bite; broad stone-and-brass guard shield. Exactly one action per cell, strong directional silhouette, normal attacks simpler than ultimate emblems, no text, numbers or dragon portraits.
```

### 13.5. Общие перки — 10

Порядок соответствует `PERK_POOLS`: крепкая чешуя, острый коготь, большое сердце, быстрые крылья, боевой дух, толстокожесть, хищник, живучесть, ярость, гранитная шкура.

```text
Strict 5 by 2 sheet of ten passive talent icons: layered defensive scale; sharpened claw; large healthy heart; streamlined wing; flame inside a heart-shield; thick hide over a stone plate; focused predator eye with claw arc but no face; sprouting star-heart; controlled rage flame with upward chevrons but no letters; granite scale wall. Neutral aged-gold, warm stone and turquoise language so perks work for every element; distinguish pairs by silhouette, not color.
```

## 14. Статусы, боевые эффекты и служебный UI

### 14.1. Статусы — 15

Экспорт 64×64 WebP, показ 24–32 px. Имена и порядок:

```text
status_burn
status_chill
status_poison
status_armor_break
status_stun
status_blind
status_root
status_guard
status_shield
status_regeneration
status_vampirism
status_dodge
status_speed_up
status_attack_up
status_weaken
```

```text
Strict 5 by 3 sprite sheet of exactly fifteen compact combat status badges: burning scale; frozen hourglass-shaped crystal without numbers; poisoned droplet with leaf; cracked armor plate; three-point stun burst; eclipsed eye; binding roots; braced guard shield; magical bubble shield; regenerating heart with sprout; crimson life-drain fang; curved dodge trail; wing with upward chevron; claw with upward chevron; drooping broken sword. Thick silhouette, minimal internal detail, each readable at 24 px, no frame, letters, numbers or character portraits.
```

### 14.2. Боевые эффекты — 7 прозрачных накладок

```text
fx_slash.webp — one broad diagonal warm-cream claw slash, tapered ends, sparse sparks.
fx_block.webp — short curved gold-and-stone impact arc with three blunt fragments.
fx_heal.webp — restrained upward turquoise-gold motes forming an open heart arc.
fx_fire_hit.webp — compact amber impact bloom with charcoal core, no smoke cloud.
fx_frost_hit.webp — radial ice-shard impact, cyan-white, no snowstorm background.
fx_storm_hit.webp — forked violet-turquoise lightning impact, centered and compact.
fx_shadow_drain.webp — inward spiral of ink-violet wisps with cold-gold center, no black rectangle.
```

Общий промт:

```text
One isolated combat VFX overlay for Draconis 3.0: [DESCRIPTION]. Transparent/chroma-key background, centered impact, readable over both dark and light biomes, effect occupies no more than 62 percent of canvas and must not cover more than 35 percent of a dragon sprite. Hand-painted storybook fantasy, controlled particle count, soft additive center, clean fading edges. No text, frame, character, scenery, lens flare, cropped particles or watermark.
```

### 14.3. Что остаётся кодовым

Не генерировать растровыми файлами:

- полосы здоровья, маны, опыта и инкубации;
- стрелки назад, закрытие, раскрытие, пагинация и переключатели;
- геометрические рамки фокуса, hover, disabled и pressed;
- числовые счётчики, уровни, проценты и бейдж `!`;
- внутренние обводки карточек и модальные подложки.

Эти элементы должны масштабироваться, менять контраст и состояние через CSS. Генерируемая графика используется для предметной семантики: здания, драконы, способности, атаки, статусы, награды и эффекты.
