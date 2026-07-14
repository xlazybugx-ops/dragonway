# Changelog

## [2.0.1] — 2026-07-14

- Полностью подключён новый экран логова на основе `lair_bg.webp` и `lair_platform.webp`.
- Добавлены статичная стая на боковых платформах, эмоции и реплики по тапу.
- Центральная платформа получила плавное раскрытие на всю ширину и нижнее меню дракона.
- Мутации перенесены в раскрывающийся блок; улучшены доступность и reduced motion.

## [2.0] — 2026-07-14

- Переработан главный CTA «Следующий шаг»: цель, причина и зона касания 58 px.
- Добавлена поддержка safe area iPhone и режима web app.
- Улучшена доступность панели ресурсов и нижней навигации.
- Добавлены состояния фокуса и адаптация CTA для низких экранов.
- Cache-busting поднят до `v=200`; сохранения и баланс совместимы с v40.

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
