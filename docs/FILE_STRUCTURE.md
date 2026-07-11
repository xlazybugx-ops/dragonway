# FILE_STRUCTURE.md — карта файлов (после реорганизации)

```
draconis-github-9/
├── index.html                 # точка входа (js/css/images из корня, ?v=N)
├── README.md CHANGELOG.md ROADMAP.md LICENSE
├── CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md
├── BUILD.md INSTALL.md PROJECT_STRUCTURE.md AI_WORKFLOW.md RELEASE_NOTES.md
├── .nojekyll .gitignore
├── js/                        # 00-balance … 11-save-init (13 модулей)
├── css/style.css
├── images/                    # спрайты видов, фоны полёта/логовищ, хаб (+fallback)
├── design/                    # дизайн-система (19 .md) + tokens/tokens.{css,json}
├── prompts/                   # 17 категорий (README) + 13 MASTER_* + библиотека/шаблоны
│   └── dragons|eggs|biomes|npcs/GUIDE.md
├── ai/                        # 12 документов постоянного контекста
├── docs/
│   ├── audits/  reports/  design-history/
│   └── PROJECT_AUDIT CLEANUP_REPORT FILE_STRUCTURE TECH_DEBT AI_PIPELINE
│       DESIGN_SYSTEM PROMPTS_INDEX PROJECT_READY RELEASE_REPORT
├── tests/  tools/
└── _archive/                  # old_docs old_assets old_scripts old_ui experiments backups
```
Полное обоснование «почему рантайм в корне» — `PROJECT_STRUCTURE.md`.
