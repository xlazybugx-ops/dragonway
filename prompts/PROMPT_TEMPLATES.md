# PROMPT_TEMPLATES.md — шаблоны по типам ассетов

Каждый шаблон = ASSET BLOCK. Собирается как `PREAMBLE + BLOCK + NEGATIVE` (см. AI_PROMPT_LIBRARY).
`{…}` — переменные. Тех.параметры указаны под блоком.

---

## Дракон (персонаж/стадия)
```
A friendly {element} dragon character named "{name}", {stage: baby with big head / young / adult /
majestic elder}, big expressive sparkling kind eyes with catchlight, gentle smile, cute plump rounded
body, unique recognizable silhouette ({silhouette_traits}), {element} soft palette, relaxed welcoming
3/4 pose, soft contact shadow, subtle warm rim light. Character sheet, centered.
```
Тех: 1024×1024, прозрачный фон, серия по виду с одним сид-диапазоном для стадий 1/25/60/100.

## Яйцо
```
A collectible {rarity} dragon egg, {rarity_form: smooth / lightly faceted / faceted / crowned /
relic}, {rarity_pattern: speckles / leaves / waves / spirals-runes / golden filigree / ancient runes},
{rarity_glow: none / soft rim / glowing halo}, {material: matte shell / gem gloss / pearlescent /
opal-magic}, front 3/4 view, soft highlight upper-left, gentle contact shadow, rarity color {hex}.
```
Тех: 512×512, прозрачный фон. Редкость должна читаться за <0.3с (форма+узор+цвет).

## Иконка
```
A semi-3D hand-painted game icon of {subject}, soft rounded form, single upper-left light, soft
top highlight and lavender lower-right shadow, uniform ~2px warm-brown outline, matte with one soft
specular, single perspective (~15° top-front), centered with safe margin.
```
Тех: 256×256, прозрачный фон, единый ракурс для всей серии иконок.

## Биом (фон/ярус)
```
A {biome} storybook environment, {palette} palette, {vegetation}, {atmosphere} mood, layered depth
(far mountains, midground, foreground) for parallax, warm directional light, {biome} colored soft fog
and {biome} tinted shadows, gentle magical {particles}. Wide scenic illustration, hero space clear.
```
Тех: сцена 16:9 (или под размер фона), слоистая композиция; фон тише героя.

## NPC
```
A friendly storybook {role} character, soft rounded shapes, big warm kind eyes, gentle pose, hand-
painted matte outfit, warm palette, single upper-left light, soft lavender contact shadow. Centered.
```
Тех: 1024×1024, прозрачный фон.

## Босс (владыка мира)
```
A majestic {biome} dragon lord, grand impressive scale, rich ornate silhouette, wise proud kind
expression, big expressive eyes, soft epic glow, crown/relic accents, amplified {element} palette with
gold, awe-inspiring but NOT scary, dramatic warm rim light, large soft lavender shadow. Hero shot.
```
Тех: 1536×1024, прозрачный или атмосферный фон; масштаб крупнее обычного дракона.

## Предмет / артефакт / ресурс
```
A hand-painted storybook {item}, semi-3D, soft rounded form, warm palette accent {hex}, single upper-
left light, soft highlight, uniform warm-brown outline, gentle glow if {rarity>=epic}. Centered.
```
Тех: 512×512, прозрачный фон.

## Растение / дерево / камень / природный объект
```
A stylized storybook {plant/tree/rock}, soft rounded organic shape, hand-painted gouache, {biome}
palette, glowing accents if magical, single upper-left light, soft contact shadow. Prop illustration.
```
Тех: 512×512–1024, прозрачный фон.

## Панель интерфейса / карточка
```
A cozy iOS-style UI {panel/card} background, warm cream paper gradient, large rounded corners, soft
lavender shadow, subtle top inset highlight, airy, translucent option with soft blur. No text.
```
Тех: под размер компонента, можно 9-slice; мягкие тени, крупный радиус.

## Кнопка
```
A soft storybook game button, warm golden gradient fill, large rounded corners, gentle soft shadow,
friendly, tactile, no metal, no heavy border. {state: default / pressed slightly scaled}.
```
Тех: под размер; варианты primary/soft/icon.

## Фон / загрузочный экран / баннер
```
A wide cozy storybook {scene: title / loading / banner} illustration, warm golden-hour sky gradient,
soft distant dragons in flight, gentle glowing particles, layered parallax depth, inviting and magical,
generous negative space for logo/text.
```
Тех: 16:9 / под экран; оставить место под лого/текст.

## Достижение (медаль/веха)
```
A hand-painted storybook achievement medal for "{title}", semi-3D, warm gold with {rarity} accent,
soft ribbon, gentle glow, single upper-left light, uniform outline, centered.
```
Тех: 512×512, прозрачный фон.

## Эффект (спрайт-лист/частица)
```
Soft storybook {effect: sparkle / glow / dust / splash}, pastel {hex} palette, soft edges, low opacity,
gentle and warm, on transparent background, tileable/loopable frames.
```
Тех: спрайт-лист или отдельные кадры, прозрачный фон; предпочтительно заменить процедурой (FX_GUIDE).

---

## Правила подстановки
- `{element}` ∈ fire/frost/venom/storm/shade; палитра — из токенов.
- `{rarity}` ∈ common/uncommon/rare/epic/legendary/ancient; `{hex}` — соответствующий rarity-токен.
- `{biome}` ∈ fire/jungle/ice/storm/shade (ключи файлов проекта).
- Имя файла результата — строго по `ASSET_NAMING.md`.
