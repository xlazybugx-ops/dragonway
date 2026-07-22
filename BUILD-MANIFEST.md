# Draconis 3.0.0 — GitHub build manifest

- Дата сборки: 23 июля 2026 года.
- Назначение: публикация содержимого этой папки в корне ветки `main` через GitHub Pages.
- Точка входа: `index.html`.
- Сборка статическая, установка зависимостей не требуется.
- Временные мастера из `tmp/imagegen/` не включены.
- Изображения: 468 оптимизированных игровых файлов, менее 50 МБ.
- Иконки способностей и боя: 81 файл.
- Проверка: `powershell -ExecutionPolicy Bypass -File tests/run-tests.ps1`.

Файл `.nojekyll` включён. После загрузки выберите в GitHub `Settings → Pages → Deploy from a branch → main → / (root)`.
