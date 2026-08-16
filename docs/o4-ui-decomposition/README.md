# O4 — Розібрати UI

**Мета:** прибрати клас багів «працює на 50 екранах, ламається на 51-му» без зміни
підтвердженої поведінки D&D 5e 2014.

**Статус:** ✅ закрито 2026-08-15 — усі KR4.1–KR4.5 підтверджені на поточному worktree.

## План уточнено після O3

Цей план знято 2026-08-15, коли [O3](../o3-rules-engine/) уже закрито, включно з KR3.6.
Це не план «переписати UI»: кожен KR бере вимірюваний шматок, спочатку фіксує поведінку,
а вже потім міняє структуру. O2 golden JSON не оновлюється під рефакторинг.

### Read-only baseline

| Метрика | Значення | Як виміряно |
|---|---:|---|
| `.tsx` | 137 | `rg --files -g '*.tsx'` |
| `.tsx` понад 400 рядків | 19 | `bun run check:ui-decomposition` |
| Найбільші | 2 263 `CharHomeClient`, 2 126 `LevelUpWizard`, 1 510 `spells-client`, 1 296 `MagicSlide`, 1 211 `FeatChoiceOptionsForm`, 1 093 `MultiStepForm` | AST guard, рядки у source |
| Найбільша JSX nesting | 14 у `spells-client` | TypeScript AST: JSX element / fragment / self-closing element, не indentation proxy |
| Дублікати | 4 pairs, 235 рядків, 0.74% | `jscpd@4.0.5`, `tsx`, 40 рядків / 200 токенів; scope усіх production UI roots: `src/app`, `src/components`, `src/lib/components` |
| Golden | 14 test-файлів, 65 JSON | `tests/golden/` |
| Pure rules | 15 test-файлів; ізольований coverage-scope: 8/8 green | `tests/rules/`; `bunx vitest run --config vitest.rules.config.mts` |
| Action/DB | 10 test-файлів | `tests/actions/`; повний прогін не робився: `db-tunnel.sh --status` показав, що тунелю немає |
| Playwright | 2 specs, 10 неавторизованих critical cases; runtime 10/10 green | `tests/e2e/{smoke,creation}.spec.ts` через локальний `spells_test` tunnel |

Повний список `.tsx` понад 400: `CharHomeClient`, `LevelUpWizard`, `spells-client`,
`MagicSlide`, `FeatChoiceOptionsForm`, `MultiStepForm`, `MainStatsSlide`, `FeaturesSlide`,
`ClassInfoModal`, `magic-items-client`, `NameForm`, `ASIForm`, `CombatSlide`,
`ModifyStatModal`, `SkillsForm`, `AddSpellDialog`, `SpellInfoModal`, `ClassChoiceOptionsForm`,
`EquipmentForm`.

### Встановлені шви й ризикові точки

- `MultiStepForm` — один caller (`src/app/char/page.tsx`), але формує порядок до 17
  можливих кроків через `dynamicSteps.push(...)`; exact step oracle досі не існує поза
  компонентом. Це найнебезпечніший рефакторинг, але водночас найцінніший.
- `FeatChoiceOptionsForm` уже має три реальні користувачі: constructor, `LevelUpWizard` і
  `LevelUpASIForm`. Це доказ спільної поведінки, а не припущення про майбутнього користувача.
- `LevelUpWizard` має один production caller (`wizard-data.tsx`), `MagicSlide` —
  `CharacterCarousel`, `spells-client` — `/spells`, `CharHomeClient` — home page і
  `SharedFolderView`. Великі компоненти з одним caller не стають «generic» автоматично:
  їх розрізаємо на локальні, предметно названі частини.
- `jscpd` baseline підтвердив два clone pairs. KR4.3 зменшив feat pair з 119 до 53
  sum-of-pair-lines через конкретний `FeatPicker`; dialog pair лишається поза scope, бо його
  legacy copy не має in-repo importer.

## Порядок KR

| KR | Про що | Чому саме тепер | Статус |
|---|---|---|---|
| [KR4.1](kr4.1-ui-baseline.md) | Вимірювання та guard для розміру, вкладеності й клонів | спершу цифри та критерій «це справді один віджет» | ✅ 2026-08-15 |
| [KR4.2](kr4.2-creation-step-resolver.md) | Чистий resolver кроків конструктора | дає oracle для найризиковішого флоу й для майбутнього E2E | ✅ 2026-08-15; creation golden 35/35 без зміни JSON |
| [KR4.3](kr4.3-duplicate-widgets.md) | Звести лише підтверджені дублікати | `FeatPicker` зведено для двох реальних form callers; scanner pair зменшився | ✅ 2026-08-15 |
| [KR4.4](kr4.4-component-boundaries.md) | Локальна межа в `ClassChoiceOptionsForm` | display subtree винесено без зміни form/controller logic | ✅ 2026-08-15 |
| [KR4.5](kr4.5-playwright-critical-flows.md) | ~10 критичних E2E | constructor DOM звіряється з resolver KR4.2; runtime 10/10 green через test tunnel | ✅ 2026-08-15 |

## Загальні межі O4

- D&D 5e 2014 лишається незмінним; 2024 rules не додаються.
- Не чіпати Prisma schema, SQL, migrations чи golden JSON. Golden diff під час рефакторингу —
  стоп-сигнал, а не привід оновити fixture.
- Один видимий флоу за PR; перед структурною зміною — characterization/proof, після —
  відповідні pure/golden/E2E перевірки. DB-тести лише через піднятий `spells_test` tunnel,
  file-serial.
- Новий shared component/helper дозволений лише коли scanner і код показали щонайменше двох
  реальних користувачів з однаковою поведінкою. Інакше частина залишається локальною.
- Не розширювати O4 у дизайн-систему, RTL/jsdom suite, зміну правил або server/db refactor.
- KR4.5 може додати browser oracle після KR4.2, але його runtime-прогін є фінальним
  integration gate: спочатку всі поточні cross-cutting refactors мають давати компільований Next
  server, потім доступний `spells_test` tunnel, і лише після цього можна заявляти E2E green.

Див. також [Р7](../DECISIONS.md#р7-ui-тестів-майже-не-буде-playwright-10-сценаріїв-в-кінці):
UI-тестів мало, але кожен має перевіряти збіг відображення з перевіреним станом.
