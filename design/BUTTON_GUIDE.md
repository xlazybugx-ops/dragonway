# BUTTON_GUIDE.md — кнопки

Единый стиль, только токены. Без металла и тяжёлых рамок.

| Тип | Фон | Форма | Отклик |
|---|---|---|---|
| Primary | `--ds-grad-gold` | радиус `--ds-r-md`, ≥48px | press scale .97 + brightness (160мс) |
| Soft/secondary | `--ds-paper-2` + контур 2px `--ds-line-col` | `--ds-r-md` | как primary |
| Icon | круглая `--ds-r-pill`, 44×44 | — | scale .94 |

- Текст — `--ds-font-display`, цвет `--ds-ink`. Тень `--ds-shadow-sm`.
- Состояния: default/hover(lift)/active(scale)/disabled(opacity .5, без тени).
- Готовность (ульта/награда) — мягкое золотое свечение `--ds-glow-soft` пульсом.
- Пример — см. `UI_STYLE_GUIDE.md`.
