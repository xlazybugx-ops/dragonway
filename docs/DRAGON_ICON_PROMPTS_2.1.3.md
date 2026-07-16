# Гайд по генерации драконов — Draconis 2.3.4

> Восстановлено и сверено с актуальной версией проекта 2.3.4. Это основной производственный гайд
> для генерации всех игровых драконов. Историческое имя файла сохранено, чтобы не ломать ссылки.

Набор предназначен для замены 60 портретов: 15 видов × 4 стадии роста. Итоговый файл: квадратный WebP или PNG 1024×1024 с настоящим альфа-каналом.

## Быстрый порядок работы

1. Выбрать вид в разделе «Виды `{SPECIES}`».
2. Выбрать стадию в разделе «Стадии роста `{AGE}`».
3. Подставить оба блока в мастер-промт без изменения общей композиции и камеры.
4. Добавить негативный промт целиком.
5. Сначала сгенерировать `_1`, затем использовать утверждённый результат как reference для `_25`, `_60` и `_100`.
6. Экспортировать под точным именем `{id}_{stage}.webp` и пройти контроль качества в конце документа.

Связанные правила: `prompts/MASTER_DRAGON_PROMPT.md`, `prompts/dragons/GUIDE.md`,
`design/ART_DIRECTION.md`, `design/ASSET_NAMING.md`.

## Общие правила серии

- Один дракон, виден целиком от рогов до кончика хвоста.
- Ракурс 3/4, голова повёрнута немного влево и вверх.
- Дракон занимает 78–82% холста, центр массы одинаков во всей серии.
- Контур читается при уменьшении до 64×64 px.
- Мягкий тёплый ключевой свет сверху слева, холодный контровой свет справа.
- Никакого окружения, пола, рамки, текста и отбрасываемой тени.
- Прозрачность должна быть реальной, а не нарисованной шахматной сеткой.
- Для всех 60 генераций использовать одинаковые seed, style reference и параметры камеры, если генератор это поддерживает.

## Мастер-промт

Заменить `{SPECIES}` и `{AGE}` фрагментами из разделов ниже.

```text
Create a premium mobile fantasy RPG dragon character icon for the game Draconis. {SPECIES}. {AGE}. A single dragon, complete full body visible from horns to tail tip, elegant three-quarter view, body facing slightly left, head looking slightly upward and toward the viewer, centered composition, readable heroic silhouette, wings and limbs clearly separated, expressive face, stylized hand-painted 3D illustration, refined scale detail, soft sculpted shapes, rich but controlled color palette, warm key light from upper left, subtle cool rim light from the right, crisp edges, polished collectible-game character art, family-friendly high fantasy, consistent proportions and camera with the rest of the icon set. Dragon occupies 80 percent of a square 1024 by 1024 canvas. Isolated object with genuine transparent alpha background, no ground plane, no cast shadow, no scenery, no border, no text. Production-ready game asset.
```

## Негативный промт

```text
background, landscape, cave, sky, clouds, floor, ground, pedestal, platform, frame, badge, circle, card, border, vignette, text, letters, numbers, logo, watermark, checkerboard pattern, fake transparency, white halo, colored halo, glow filling the background, cast shadow, cropped horns, cropped wings, cropped tail, cut-off body, multiple dragons, rider, human, egg, extra heads, extra wings, extra legs, fused limbs, malformed anatomy, duplicate tail, photorealism, horror, gore, muddy colors, excessive particles, excessive bloom, motion blur, depth-of-field blur, low detail, noisy edges
```

## Стадии роста `{AGE}`

### `_1` — детёныш

```text
Newly hatched baby dragon, oversized head and bright expressive eyes, short muzzle, compact chubby body, tiny rounded horns, tiny wings, oversized paws, playful stable pose, adorable but recognizable species features, no eggshell.
```

### `_25` — молодой

```text
Young juvenile dragon, slim agile body, curious confident expression, half-grown wings, medium paws, short developing horns, playful alert stance, clearly older than a hatchling but not yet muscular.
```

### `_60` — взрослый

```text
Fully grown adult dragon, athletic powerful anatomy, mature horns, broad functional wings, confident guardian stance, focused intelligent expression, balanced strength and elegance.
```

### `_100` — древний

```text
Ancient majestic dragon, grand powerful anatomy, huge ornate but readable wings, long crown-like horns, layered mature scales, subtle glowing ancestral markings, wise commanding expression, regal pose, legendary presence without extra scenery or background effects.
```

## Виды `{SPECIES}`

### Огонь

**`ember` — Эмберлинг**

```text
Friendly orange-red fire dragon with warm copper scales, golden cream chest plates, rounded swept-back horns, glowing amber eyes, small ember fins along the spine and a bright flame-shaped tail tip; lively sparks remain tightly attached to the body silhouette.
```

**`cinderpup` — Жарёныш**

```text
Mischievous compact fire dragon resembling an ember puppy, vivid vermilion scales, charcoal paws, oversized sturdy feet, small triangular ears and horns, joyful grin, torch-like tail tip, energetic personality and a clearly different silhouette from Emberling.
```

**`magma` — Магмарок**

```text
Heavy bulky lava dragon, low center of gravity, massive shoulders, dark cracked obsidian armor plates with restrained orange magma seams, broad blunt horns, stone-like claws, slow unstoppable colossus silhouette.
```

**`pyrelord` — Пламевластец**

```text
Regal fire dragon lord with elegant crimson scales, molten-gold chest armor, tall crown-shaped horns, flame-like wing edges, long noble neck and volcanic majesty; controlled golden fire accents stay inside and immediately around the silhouette.
```

### Лёд

**`glacier` — Гляциар**

```text
Ice-blue armored dragon with pale silver belly scales, translucent cyan crystal spikes, angular frost horns, sturdy legs, clear frosty breath kept close to the muzzle, calm protective expression and a clean crystalline silhouette.
```

**`permafrost` — Вечнолёд**

```text
Ancient stocky frost dragon covered in layered glacier-ice armor, thick limbs, short powerful neck, heavy icicle beard, blunt frozen horns, pale blue-white palette, sleepy strength and an immovable fortress-like silhouette.
```

**`aurora` — Аврорин**

```text
Elegant polar dragon with pearl-white and deep arctic-blue scales, slender graceful body, long swept crystal horns, wing membranes glowing with restrained ribbons of green violet and cyan aurora, star-blue eyes and a noble celestial silhouette.
```

### Яд и лес

**`sporewing` — Спорокрыл**

```text
Slender swamp-green dragon with warm moss and teal scales, rounded mushroom-like spots on translucent wings, small fungal crest shapes, curious bright eyes, flexible tail and a delicate trail of spore dust kept very close to the silhouette.
```

**`blightfang` — Гнилоклык**

```text
Sneaky moss-green venom dragon with a low feline-reptile stance, oversized ivory venom fangs, leaf-camouflage scale plates, thorny cheek fins, amber-green eyes, sly grin and a fast ambush-predator silhouette.
```

**`worldserpent` — Мирозмей**

```text
Mythical serpent-dragon with a long coiling but fully readable body, primordial green-gold scales, ancient world-root patterns, branch-like crown horns, small powerful limbs, broad ceremonial wings and a wise earthbound presence; coils do not hide the head or limbs.
```

### Шторм

**`tempest` — Темпестар**

```text
Violet storm dragon with an aerodynamic body, swept-back wind crest, silver-blue belly, lightning-pattern wing membranes, bright electric eyes, long balanced tail and energetic airborne-ready posture; tiny lightning accents hug the silhouette.
```

**`thundercall` — Громозов**

```text
Swift muscular storm dragon with a powerful thunder-drum chest, indigo and steel-blue scales, branching lightning horns, sharp swept wings, confident roaring expression and a dynamic runner-like stance; restrained electricity remains close to horns and claws.
```

### Тень

**`umbra` — Умбракс**

```text
Dusky purple shadow dragon with soft midnight scales, graceful bat-like wings whose membranes contain subtle star patterns, curved moon-silver horns, luminous lavender eyes and a quiet mysterious posture; soft glow stays within the silhouette.
```

**`nightwyrm` — Сумрачник**

```text
Sleek cat-like night dragon with black-violet scales, flexible feline spine, crescent-moon markings, ember-orange eyes, compact silent wings, long whisker-like cheek fins and a poised stealth-hunter silhouette.
```

**`voidmaw` — Бездномор**

```text
Mythic void dragon with deep-space blue-black scales, imposing angular head, ancient sweeping horns, nebula-galaxy wing membranes, subtle star points embedded in the body, powerful limbs and a timeless cosmic presence; all cosmic effects remain contained inside the dragon silhouette.
```

## Имена выходных файлов

Для каждого id создать четыре файла:

```text
{id}_1.webp
{id}_25.webp
{id}_60.webp
{id}_100.webp
```

Полный список id:

```text
ember, cinderpup, magma, pyrelord,
glacier, permafrost, aurora,
sporewing, blightfang, worldserpent,
tempest, thundercall,
umbra, nightwyrm, voidmaw
```

## Настройки генерации и экспорта

- Холст: 1024×1024, RGBA.
- Формат в проекте: lossless WebP с альфа-каналом; PNG допустим как мастер.
- Не обрезать прозрачные поля автоматически: одинаковый холст нужен для стабильного масштаба интерфейса.
- Рекомендуемый alpha threshold при очистке: 2–4/255; края сохранить полупрозрачными.
- После генерации проверить изображение на белом, чёрном и фиолетовом фоне.
- Не добавлять внешнюю тень в файл: интерфейс создаёт собственный `drop-shadow`.
- Генерировать сначала все стадии одного вида с reference предыдущей стадии, затем переходить к следующему виду.

## Контроль качества одной иконки

1. Фон имеет alpha=0, отсутствуют белые или цветные прямоугольники.
2. Рога, крылья, лапы и хвост целиком помещаются в холст.
3. В уменьшении 64×64 вид и стихия узнаются без подписи.
4. Возраст читается по пропорциям, а не только по количеству деталей.
5. Цвет и анатомия совпадают на всех четырёх стадиях одного вида.
6. Нет предметов, платформы, земли, рамки и текста.
