# Draconis — Art Direction (Cozy Storybook Fantasy)

Художественный фундамент для масштабной ИИ-генерации в едином стиле. **Ассеты пока не заменяются** —
сначала полностью описана архитектура стиля (по требованию). Игровой код/логика/баланс/данные не
тронуты; токены не подключены к билду.

## Порядок чтения
1. `ART_DIRECTION.md` — анализ текущего стиля, несоответствия, концепция, столпы.
2. `STYLE_GUIDE.md` + `COLOR_SYSTEM.md` + `VISUAL_TOKENS.md` (+ `tokens/`) — визуальный язык и токены.
3. Предметные гайды: `UI_STYLE_GUIDE`, `ICON_GUIDE`, `DRAGON_GUIDE`, `EGG_GUIDE`, `BIOME_GUIDE`,
   `NPC_GUIDE`, `FX_GUIDE`, `ANIMATION_GUIDE`.
4. Пайплайн: `AI_PROMPT_LIBRARY.md` → `PROMPT_TEMPLATES.md` → `ASSET_NAMING.md`.

## Принцип
`PREAMBLE (неизменяемый стиль) + ASSET BLOCK + NEGATIVE` → ассет по `ASSET_NAMING` → падает в игру без
изменения кода (у всех ссылок есть fallback). Единый источник правды — `tokens/tokens.{css,json}`.
