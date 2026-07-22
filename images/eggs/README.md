# Комплект изображений яиц

Подготовлен 22 июля 2026 года по документу `GRAPHIC-AUDIT-AND-MISSING-UI-ASSETS-2026.md`.

Все игровые изображения:

- имеют размер 384×384 px;
- сохранены в WebP lossless с альфа-каналом;
- содержат один центрированный объект без фоновой сцены;
- имеют прозрачные углы и безопасное поле;
- предназначены для карточек гнезда, стартового вылупления, наград и Кодекса.

## Соответствие данным игры

| ID в `EGG_DEFS` | Файл |
|---|---|
| `egg_fire` | `egg_fire.webp` |
| `egg_frost` | `egg_frost.webp` |
| `egg_venom` | `egg_venom.webp` |
| `egg_storm` | `egg_storm.webp` |
| `egg_shade` | `egg_shade.webp` |
| `egg_forest` | `egg_forest.webp` |
| `egg_crystal` | `egg_crystal.webp` |
| `egg_royal` | `egg_royal.webp` |
| `egg_ancient` | `egg_ancient.webp` |
| `egg_primord` | `egg_primord.webp` |
| `egg_ashking` | `egg_ashking.webp` |
| `egg_northward` | `egg_northward.webp` |
| `egg_emerald` | `egg_emerald.webp` |
| `egg_eclipse` | `egg_eclipse.webp` |
| `egg_stormcrown` | `egg_stormcrown.webp` |
| `egg_purity` | `egg_purity.webp` |

## Генерационный шаблон

```text
Use case: stylized-concept
Asset type: collectible dragon egg for Draconis browser game, final game asset
Primary request: A single [EGG DESCRIPTION]
Style/medium: cozy hand-painted storybook fantasy, polished gouache and soft digital painting, rounded friendly silhouette, subtle dark-brown outline, tactile handcrafted shell, consistent with a family-friendly dragon sanctuary game
Composition/framing: exactly one egg, centered, full object visible, three-quarter front view, thick readable egg silhouette, 12 percent safe padding, no crop, no contact shadow
Lighting/mood: restrained internal magical glow
Constraints: readable at 256 px
Avoid: text, letters, numbers, watermark, logo, signature, photorealism, 3D render, glossy casino style, neon cyberpunk, anime, emoji, flat clipart, busy background, duplicate egg, cast shadow, reflection
```

Исходные генерации остаются во внутреннем каталоге генератора. В релиз включаются только оптимизированные игровые WebP-файлы из этой папки.
