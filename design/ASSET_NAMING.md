# ASSET_NAMING.md — именование ассетов

**Критично:** новые ИИ-ассеты должны попадать в игру БЕЗ изменения кода. Для этого имена файлов и
размеры совпадают с тем, что игра уже запрашивает. Все существующие ссылки имеют fallback (procedural
или другой формат), поэтому замена безопасна.

## Реальные конвенции из кода (v33)

### Спрайты видов (портрет/стадия)
```
images/{speciesId}_{stage}.webp        stage ∈ {1, 25, 60, 100}
```
`stage` — пороги `stageForLevel` (1/25/60/100). Пример: `images/aurora_60.webp`.
15 id: ember, cinderpup, magma, pyrelord, glacier, permafrost, aurora, sporewing, blightfang,
worldserpent, tempest, thundercall, umbra, nightwyrm, voidmaw.

### Спрайт дракона в полёте
```
images/{speciesId}_fly_{stage}.png     stage ∈ {1, 25, 60}
```
Пример: `images/ember_fly_25.png`. (PNG; есть fallback-перебор стадий.)

### Фоны ярусов полёта
```
images/fly_{sceneKey}_{tier}.webp      sceneKey ∈ {fire, jungle, ice, storm, shade}; tier ∈ {1,2,3}
```
Соответствие мир→ключ (`FLY_ART_KEY`): emberreach→fire, mirelot→jungle, glacior→ice, stormpeak→storm,
voidedge→shade. При отсутствии файла — процедурный фон (палитры в коде). Пример: `images/fly_ice_2.webp`.

### Фоны логовищ (den)
```
images/den_{sceneKey}.png              sceneKey ∈ {fire, jungle, ice, storm, shade}
```
Пример: `images/den_jungle.png`. Есть fallback (null → без картинки).

### Хаб
```
images/hub_bg.webp
images/hub_bg_wide.webp
```
Есть `onerror` → класс `hub-bg-fallback`.

## Предлагаемые конвенции (UI-слой, пока не в коде — для будущей интеграции)
Иконки/яйца/эффекты рендерятся сейчас эмодзи/SVG. При переходе на растровые ассеты держать единый
префикс, чтобы легко подключить:
```
art/icons/icon_{name}.webp             icon_gold, icon_dust, icon_shard, icon_star
art/icons/egg_{catId}.webp             egg_ancient, egg_royal, egg_fire ...
art/icons/status_{name}.webp           status_shield, status_burn ...
art/ui/panel_{name}.webp  ui/btn_{name}.webp
art/fx/fx_{name}_{frame}.webp
art/bg/loading_{n}.webp  bg/banner_{name}.webp
art/npc/npc_{role}.webp  boss/boss_{sceneKey}.webp
```
(Интеграция этих — отдельная задача миграции; данные/логику не трогаем.)

## Технические требования
- **Формат:** WebP (сжатие) для растровых; PNG где нужен точный alpha (спрайты полёта).
- **Прозрачность:** персонажи/иконки/яйца/предметы — alpha. Сцены — без alpha.
- **Размер и соотношение:** совпадает с заменяемым файлом (не менять габариты — код рассчитан на них).
- **Вес:** фоны полёта — цель ≤400–600 КБ/файл (см. PERFORMANCE_AUDIT — сейчас 1.3–2.1 МБ). Спрайты
  видов держать в диапазоне текущих (12–35 КБ).
- **Именование:** строчные, `snake_case`, точное совпадение с ключами кода.

## Правило безопасной замены
1. Сгенерировать ассет по шаблону промпта (единый стиль).
2. Назвать ТОЧНО как существующий файл, тот же размер/пропорции/формат.
3. Положить в `images/`. Игра подхватит без правок кода; при проблеме сработает fallback.
4. Проверить визуально на устройстве; вес — в бюджете.
