# AI_WORKFLOW — разработка и генерация контента с ИИ

## Онбординг любой модели
1. `ai/PROJECT_CONTEXT.md` → `ai/AI_RULES.md` → профильные правила (`ARCHITECTURE/CODING/UI/DESIGN/
   CONTENT/PROMPT_RULES`).
2. Для кода — `ai/CODING_RULES.md` + `ai/RELEASE_PROCESS.md`.
3. Для арта — `design/` + `prompts/`.

## Генерация ассетов (кратко)
`MASTER_STYLE_PROMPT` + блок категории (`prompts/PROMPT_TEMPLATES.md`) + NEGATIVE → приёмка по
`design/STYLE_GUIDE.md` → имя по `design/ASSET_NAMING.md` → в `images/` → `?v=N`. Подробно —
`design/AI_ASSET_PIPELINE.md`.

## Изменения кода
Точечные правки, `node --check` (файлы + конкатенация), сохранение совместимости сейвов, без правки
баланса/механик без задачи. Значимые решения — в `ai/DECISIONS.md`.

## Гарантия качества
Единые токены + неизменяемые преамбулы + чек-листы → любой ИИ выдаёт результат «одной команды».
