# Changelog

Формат по мотивам Keep a Changelog. Версия ассетов/кэша — `?v=N` в `index.html`.

## [Unreleased] — Release Engineering & AI Foundation
### Added
- Профессиональная структура: `design/`, `prompts/`, `ai/`, `docs/`, `tests/`, `tools/`, `_archive/`.
- Дизайн-система (17+ гайдов) и токены `design/tokens/tokens.{css,json}`.
- AI-библиотека промптов: 17 категорий + 13 `MASTER_*` + библиотека/шаблоны.
- AI-governance: 12 документов постоянного контекста (`ai/`).
- GitHub-мета: README, CHANGELOG, ROADMAP, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, BUILD, INSTALL,
  PROJECT_STRUCTURE, AI_WORKFLOW, RELEASE_NOTES.
- Финальные отчёты в `docs/` (аудит, структура, очистка, тех-долг, готовность, индексы).
### Changed
- 40+ отчётов/дизайн-доков перенесены из корня в `docs/`.
### Removed / Archived
- Прототипы (`arcade-prototype.html`, `den-prototype.html`) и `DEN-COMBAT-REPORT.pdf` → `_archive/`.
- Убран оставшийся DEBUG `console.log` (07-flight.js).
### Unchanged (намеренно)
- Игровые механики, баланс (`GB`), структура данных, порядок загрузки, `css/js/images`-пути.

## [v33] — Game feel & QA polish
- Отклик кнопок, празднование уровня, reduced-motion. Полный лог — `docs/`.
