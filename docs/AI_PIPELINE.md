# AI_PIPELINE.md — единый ИИ-конвейер (сводно)

## Контур
`ai/` (контекст+правила) → `design/` (стиль+токены) → `prompts/` (промпты) → `images/` (интеграция).

## Генерация ассета
1. Категория в `prompts/<cat>` + `prompts/MASTER_*`.
2. Промпт = STYLE-преамбула + блок (`PROMPT_TEMPLATES`) + NEGATIVE + тех.параметры.
3. Приёмка по `design/STYLE_GUIDE.md`.
4. Имя по `design/ASSET_NAMING.md` → в `images/` (fallback гарантирует безопасность) → `?v=N`.

## Разработка кода с ИИ
Онбординг `ai/PROJECT_CONTEXT.md` → правила → точечные правки → `node --check` → `ai/DECISIONS.md`.

## Гарантия единого качества
Единые токены + неизменяемые преамбулы + чек-листы = результат «одной художественной команды» от любой
модели. Детали — `design/AI_ASSET_PIPELINE.md`, `AI_WORKFLOW.md`.
