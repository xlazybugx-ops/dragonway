# Draconis 3.1.1 — GitHub build manifest

- Дата сборки: 23 июля 2026 года.
- Назначение: публикация содержимого этой папки в корне ветки `main` через GitHub Pages.
- Точка входа: `index.html`.
- Сборка статическая, установка зависимостей не требуется.
- Временные мастера из `tmp/imagegen/` не включены.
- Изображения: оптимизированные игровые файлы; лимит сборки не более 100 МБ.
- Иконки способностей и боя: 81 файл.
- Проверка: `powershell -ExecutionPolicy Bypass -File tests/run-tests.ps1`.

Файл `.nojekyll` включён. После загрузки выберите в GitHub `Settings → Pages → Deploy from a branch → main → / (root)`.
