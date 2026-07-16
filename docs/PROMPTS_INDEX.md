# PROMPTS_INDEX.md — индекс промптов

## Библиотека
- `prompts/AI_PROMPT_LIBRARY.md` — неизменяемая STYLE-преамбула + NEGATIVE + правила сборки.
- `prompts/PROMPT_TEMPLATES.md` — параметризованные блоки по типам ассетов.

## Мастер-промпты (13)
STYLE · UI · ICON · DRAGON · EGG · BIOME · BACKGROUND · NPC · ITEM · EFFECT · ANIMATION · SPLASH ·
MARKETING (`prompts/MASTER_*.md`).

## Категории (17, у каждой README)
art · ui · icons · dragons · eggs · biomes · bosses · npcs · items · effects · animations ·
backgrounds · marketing · qa · release · refactoring · updates.

## Контент-гайды
`prompts/dragons|eggs|biomes|npcs/GUIDE.md` — детальные правила по типу.

## Готовые производственные промты
- `docs/DRAGON_ICON_PROMPTS_2.1.3.md` — актуальный для версии 2.3.4 полный гайд по драконам:
  мастер-промт, негативный промт, 4 стадии роста и описания всех 15 видов (60 итоговых ассетов).

## Правило
Любой промпт = мастер-преамбула + блок категории + NEGATIVE. Имена выходных файлов — по
`design/ASSET_NAMING.md`.
