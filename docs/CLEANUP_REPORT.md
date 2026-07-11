# CLEANUP_REPORT.md — отчёт об очистке (ЭТАП 2–3)

## Удалено (безопасно, код)
- Оставшийся DEBUG `console.log('[Драконис] полёт v12 …')` — `js/07-flight.js`. Файл перепроверен
  (`node --check` — чисто). Больше DEBUG-логов нет.

## Перенесено в `_archive/`
- `arcade-prototype.html`, `den-prototype.html` → `_archive/experiments/` (не подключены в index.html).
- `DEN-COMBAT-REPORT.pdf` → `_archive/old_docs/`.
- `art/README.md` → `_archive/old_docs/art_README.md` (папка `art/` расформирована).

## Перенесено в `docs/`
- Все аудиты (`*_AUDIT`, `RELEASE_READINESS`, `BUG_REPORT`, `EMOTION_CURVE`, `TECH_DEBT`,
  `APPLE_HIG_REVIEW`, `PROGRESSION_AUDIT`) → `docs/audits/`.
- Отчёты/чейнджлоги (`*_REPORT`, `*CHANGELOG*`, `PLAYER_FLOW`, `GAME_FEEL`, `RELEASE_CHECKLIST`,
  `ROADMAP_POST_BETA`, `SYSTEM_GRAPH`) → `docs/reports/`.
- Прочие дизайн/фичи-доки (`*_REWORK`, `EGG_SYSTEM*`, `GAME_BALANCE`, `CONTENT_FRAMEWORK`,
  `SKILLTREE-CLASSES-DESIGN`, `DESIGN-GUIDE`, `ASSETS-FLIGHT`, `STRUCTURE` и др.) → `docs/design-history/`.

## Реорганизовано
- Прежняя папка `art/` → `design/` (гайды + `tokens/`) и `prompts/` (библиотека/шаблоны, гайды по
  категориям). `art/` расформирована.

## Создано (папки)
`_archive/{old_docs,old_assets,old_scripts,old_ui,experiments,backups}`, `docs/{audits,reports,
design-history}`, `design/` (+`tokens/`), `prompts/` (17 категорий), `ai/`, `tests/`, `tools/`.

## НЕ тронуто (намеренно)
`index.html`, `js/`, `css/`, `images/` — деплой-структура и все пути. Игровые механики, баланс,
данные, порядок загрузки — без изменений.

## Правило при сомнении
Ничего не удалялось «на всякий случай» — только перенос в `_archive/`.
