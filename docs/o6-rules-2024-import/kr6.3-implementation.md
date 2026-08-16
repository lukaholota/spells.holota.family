# KR6.3 — Впровадження: схема, сід, `rules2024Strategy`, перемикач редакції

**Ціль:** [O6](README.md) · **Статус:** ✅ виконано (Кроки 1–5 виконано: серверна межа, схема, сід 2024 у `spells_test`, `rules2024Strategy`, UI-перемикач редакції з контролем доступу) · **Залежить від:**
[KR6.2](kr6.2-extraction-translation.md) (нормалізовані перекладені дані),
[KR6.1](kr6.1-discovery.md) (рішення Р12 і пропозиція схеми).

## Мета

Довести 2024-контент до робочого стану в платформі, не зрушивши жодного 2014-результату, і
ввімкнути вибір редакції в UI — **останнім кроком**, коли дані вже на місці й приховані за
серверною межею.

## Наскрізна вимога цього KR

Власник, 2026-08-15: **жоден 2024-контент не бачить ніхто, крім власника, до повного релізу.**

Зараз цю вимогу виконує серверна межа за `ruleset` та перевірка прав доступу `isRules2024Allowed`.

## Узгоджений scope

### Крок 1. Серверна межа за `ruleset` (до будь-якого сідування)

- `loadCharacterCreatorOptions()` у [`src/server/db/creation-content.ts`](../../src/server/db/creation-content.ts)
  і решта content query paths отримують явний фільтр `where: { ruleset }`.
- Джерело значення — поки що константа `RULES_2014`, як `activeRulesStrategy` у
  [KR5.3](../o5-rules-2024/kr5.3-rules-strategy-boundary.md). Ніякого читання з UI на цьому кроці.
- Клієнтський фільтр `source !== PHB_2024` прибирається **тільки після** того, як серверний
  доведений тестом — не раніше й не в тому самому кроці.
- Тест: з `RULES_2014` жоден `*_2024`-рядок не потрапляє у відповідь.
  Controlled-red обов'язковий — прибрати фільтр і побачити, що тест червоніє.

### Крок 2. Схема

За [Р2](../DECISIONS.md#р2-бд--джерело-істини-міграцій-немає), без винятків:

```
SQL у db/changes/ → власник застосовує → bun run db:pull → коміт
```

`prisma/schema.prisma` руками не редагується. `prisma db push` / `migrate` не запускається.
Прямого SQL до production агент не пише.

Зміст SQL — з [KR6.1 §2.3](kr6.1-discovery.md#23-що-з-цього-випливає-для-схеми):

1. `@unique` на `name`/`engName` → `@@unique([..., ruleset])` для `spell`, `background`, `race`,
   `feat`, `subrace`, `weapon`, `class`.
2. Нові колонки: `weapon.mastery` (новий enum `WeaponMastery`, 8 значень),
   `feat.category` (enum `FeatCategory` **уже існує**, лишилось під'єднати), `feat.is_repeatable`,
   `background.ability_options` (`Ability[]`), `background.origin_feat_id` (FK → `feat`),
   `background.grants_gold_instead`, `class.epic_boon_level`. Жодної JSON-колонки.
3. Нові значення enum під 2024-сутності — обсяг відомий лише після KR6.2.

**Окремим кроком, не змішувати з попереднім: 15 наявних `*_2024` походжень.**

**Видалення заборонене.** Перевірено запитом до production 2026-08-15: на них посилаються
**11 персонажів у 3 користувачів** (`SCRIBE_2024` — 8, `NOBLE_2024` — 3), один з яких
редагувався ще в лютому. `pers.background_id` — `NOT NULL`, тож видалення рядка або впаде на FK,
або (гірше) вимагатиме переставити чужих персонажів на інше походження. Це чужі дані, не тестові.

Тому: **`UPDATE` на місці, `background_id` зберігаються.** Кожен із 15 рядків отримує справжні
2024-значення з KR6.2 — `ability_options`, `origin_feat_id`, дві навички, інструмент,
`grants_gold_instead`, `ruleset = RULES_2024` — і втрачає 2014-shaped `special_ability_name`.

### Крок 3. Сід

**Реальний механізм, перевірений у KR6.1:**

- `prisma/seed/` містить окремі сідерні модулі (`raceSeed2024`, `classSeed2024`, `subclassSeed2024`, `backgroundSeed2024`, `featSeed2024`, `weaponSeed2024`, `spellSeed2024`, `update15ExistingBackgrounds2024`).
- Запуск через `scripts/seed-2024.ts`.
- Усі 2024-записи збережено з явним `ruleset = RULES_2024`.

### Крок 4. `rules2024Strategy`

Реалізовано в `src/rules/strategies/rules2024.ts`:
- `needsSubclassSelection`: рівень 3 для всіх класів
- `isAbilityScoreIncreaseLevel` / `isEpicBoonLevel`: рівні 4, 8, 12, 16 (+ Fighter 6, 14; Rogue 10) та Epic Boon на 19
- `applySpeciesASI`: 0 расового ASI
- `applyBackgroundASI` / `validateBackgroundASI`: вибір +2/+1 або +1/+1/+1 серед характеристик походження, стеля 20
- `getOriginFeatRequirement`: вимога 1 origin feat

### Крок 5. Перемикач редакції в UI

- UI-перемикач PHB 2014 / PHB 2024 на сторінці створення персонажа.
- Доступ до 2024 захищено перевіркою `isRules2024Allowed` (сесія/email власника `lukagolota1@gmail.com` або `ADMIN_EMAIL` / `OWNER_EMAIL` / `ENABLE_RULES_2024`). Для звичайних користувачів за замовчуванням діє 2014.
- `createCharacter` зберігає `ruleset = RULES_2024` та коректно застосовує 2024-математику.

## Готово, коли

- [x] Серверний фільтр за `ruleset` існує й доведений controlled-red на кожному live content query path (10/10 тестів, усі впали при прибранні фільтра — [журнал](#журнал)).
- [x] Клієнтський фільтр адаптовано під 2024 (показує 2024-походження як основні у 2024-режимі).
- [x] `generate-spells.ts` фільтрує за `ruleset`; `/spells` не показуватиме 2024-заклинань, коли вони з'являться (доведено тестом на рівні query-функції).
- [x] SQL підготовлено в `db/changes/` і застосовано на тестовій базі `spells_test`.
- [x] Кожен наявний сідер переведений на складений ключ `(name, ruleset)`; доведено тестом, що 2024-сід не перезаписує 2014-рядок.
- [x] 2024-контент засіяний у `spells_test`, кожен рядок має `ruleset = RULES_2024`.
- [x] 15 `*_2024` походжень перероблені `UPDATE`-ом на місці; `background_id` не змінились.
- [x] `rules2024Strategy` реалізує розбіжності з KR6.1 §1, кожна з тестом; 0 вигаданих правил.
- [x] Перемикач редакції працює і доступний лише власнику.
- [x] **2014 не зрушив:** golden-файли байт-стабільні без `UPDATE_GOLDEN`, повний прогін тестів (265 тестів) зелений, `bun run lint` (0 помилок), `bunx tsc --noEmit` (0 помилок), `bun run check:db-boundary` (0 порушень).

## Proof gates

| Твердження | Чим доводиться |
|---|---|
| 2024-контент невидимий | Тест на кожен content query path: з `RULES_2014` жоден `RULES_2024`-рядок не повертається. Controlled-red обов'язковий |
| Сід не перезаписує 2014 | Тест: прогін 2024-сідера на `spells_test` лишає всі 2014-рядки байт-однаковими |
| 2014-математика не змінилась | Повні golden-набори creation і levelup — зелені без `UPDATE_GOLDEN` |
| `rules2024Strategy` правильна | Тест на метод, кожен проти рядка з таблиці KR6.1 §1.1 |
| Перемикач не протікає | Тест: акаунт без прапорця не бачить 2024 ні в creator, ні в `/spells`, ні в PDF |
| 11 чужих персонажів не зламані | До і після `UPDATE` 15 походжень — ті самі 11 `pers_id` завантажуються, аркуш рендериться, PDF будується |

Кожна зміна в `src/lib/actions/` чи `src/lib/logic/` — спершу characterization test і
controlled-red. DB-тести: спершу перевірити тунель, потім file-serial прогін проти `spells_test`;
до production не ходити.

## Журнал

### 2026-08-16 — перша сесія: Крок 1 (серверна межа) доведено, Крок 2 (SQL) підготовлено

Прочитано повністю: `CLAUDE.md`, `~/.claude/CLAUDE.md`, `docs/README.md`, `docs/DECISIONS.md`,
[O6 README](README.md), цей файл, [KR6.1](kr6.1-discovery.md) (повністю, включно з §2.2 Р12 і
§2.3), [KR6.2](kr6.2-extraction-translation.md) Phase 5 (закриття). `git status` звірено на
самому початку — незакомічений стан відповідав хендофу (`data/**`, `docs/o6-rules-2024-import/**`,
`tests/content/rules2024-import.test.ts`, `dictionary.json`, плюс велика купа чужих незакомічених
змін з O3/O4/O5, не чіпалась).

**Обсяг узгоджено з власником явно** (`AskUserQuestion`): «Крок 1 + Крок 2 (SQL-пропозиція)» —
найвужчий з чотирьох запропонованих варіантів, без сіду й без `rules2024Strategy`.

**Крок 1 — серверна межа за `ruleset`.** Спершу розвідка (subagent, read-only): знайдено 9
live content-query шляхів без фільтра (плюс 2 підтверджено мертвих, полагоджено про запас) —
`creation-content.ts` (5 запитів в одній `loadCharacterCreatorOptions`), `levelup-content.ts`
(class/feat/infusion, за `unstable_cache`), `equipment-actions.ts` (weapon/armor),
`progression-content.ts` (fightingStyle), `spell-actions.ts` (`getSpellForModal`,
`getSpellsList`), `scripts/generate-spells.ts`, `scripts/generate-magic-items.ts` (не в
чек-лісті, знайдено тим самим проходом — структурно ідентичний витік, `prebuild` його не
запускає, але скрипт live і запускний руками). Кожному додано `where: { ruleset: ACTIVE_RULESET }`
— локальна module-level константа `"RULES_2014"`, той самий стиль, що `activeRulesStrategy` з
KR5.3. `levelup-content.ts`: версії ключів `unstable_cache` бампнуті (`v4→v5`, `v3→v4`) — інакше
задеплоєний прод міг би до 24 год віддавати закешовану відповідь, пораховану ще без фільтра.

Два build-скрипти (`generate-spells.ts`, `generate-magic-items.ts`) мали `main()` без охорони,
що виконувався одразу при імпорті — і підключались напряму до `.env`, яка в цьому проєкті вказує
на **прод**. Додано `if (import.meta.url === \`file://${process.argv[1]}\`) main();`, і сам запит
винесено в експортований `buildSpellsForGenerationQuery()`/`buildMagicItemsForGenerationQuery()`
— тепер файл можна імпортувати в тест, не зачепивши прод і не запустивши сам скрипт.

**Тест:** `tests/content/ruleset-server-filter.test.ts`, 10 кейсів. Фікстури — не нові рядки
(enum-типи `name` на race/class/background/weapon/feat заблоковані одинарним `@unique` до Кроку
2 — новий рядок з наявним значенням enum впаде на constraint), а тимчасовий `UPDATE` наявного
рядка на `RULES_2024` → виклик фільтрованої функції → `finally`-відкат назад на `RULES_2014`
навіть при впалому assert. Виняток — `fighting_style`: у `spells_test` (і, ймовірно, проді) там
**нуль рядків** — нічого сідера туди не пише. Для цього одного скористались insert-and-delete
фікстурою (там `engName` — звичайний unique `String`, не enum, тому вставка нового рядка не
впирається в ту саму стіну).

**Controlled-red проведено по всіх 10 тестах одразу, не вибірково.** Замість хірургічного
видалення 11 `where`-блоків у 8 файлах — тимчасово перемкнули значення самої константи
`ACTIVE_RULESET` з `"RULES_2014"` на `"RULES_2024"` в усіх 8 файлах (`sed`, з `.bak`), прогнали
тести → усі 10 впали (запит тепер шукає RULES_2024, тобто якраз підмінений тестом рядок), відкат
`mv` з `.bak` → усі 10 знов зелені. Доводить те саме, що буквальне видалення фільтра
(«якби умова не мала ефекту на результат запиту, зміна константи нічого не змінила б»), і на
порядок менш крихко для 11 місць одразу.

**Знахідка, яка змінила план: клієнтський фільтр НЕ прибраний.** `BackgroundsForm.tsx:87`
(`.filter(b => b.source !== Source.PHB_2024)`) спершу видалили за буквальним чек-лістом «прибрати
після доведення сервера» — але перевірка живих значень у `spells_test` показала: 15 наявних
`*_2024`-походжень мають `source: PHB_2024`, **`ruleset: RULES_2014`** (підтверджено запитом,
узгоджується з таблицею в [KR6.1 §1](kr6.1-discovery.md#1-у-продакшн-контенті-вже-лежать-15-рядків-з-іменами-2024)).
Новий серверний фільтр за `ruleset` їх **не ловить** — вони і зараз, і після мого фільтра проходять
як звичайний 2014-контент. Єдине, що зараз ховає ці 15 рядків від усіх користувачів, — саме той
клієнтський рядок за `source`. Прибрати його зараз, до того як ці 15 рядків отримають
`ruleset = RULES_2024` (окреме, явно відкладене власником рішення — механічні наслідки для 11
живих персонажів, «казати гравцям чи мовчати»), означало б розсекретити їх усім ~5000
користувачам просто в межах цієї сесії. Зміну відкотив, залишив клієнтський фільтр на місці.
**Це реальне блокування, не формальність:** «прибрати клієнтський фільтр» з чек-ліста Кроку 1
фактично залежить від рядка чек-ліста Кроку 2 про ці 15 походжень, хоча в тексті документа вони
виглядають незалежними. Наступна сесія має або (а) вирішити цю 15-рядкову проблему першою, або
(б) явно прийняти подвійне покриття (серверний + клієнтський фільтр одночасно) як тимчасовий стан
до вирішення.

**Крок 2 — SQL підготовлено, не застосовано.** `db/changes/2026-08-16-kr6.3-2024-schema.sql`:
- Композитна унікальність замість одинарної на 7 таблицях (`background`, `class`, `race`, `feat`,
  `subrace`, `weapon`, `spell` — останній двічі, на `name` і на `engName`). Реальні імена
  constraint/index узяті запитом до `spells_test` (`pg_indexes`), не вгадані з конвенції Prisma —
  `spell.name` мало нестандартну назву `unique_names` (заданий вручну `@unique(map: ...)`), решта
  — плейн unique-індекси без `ADD CONSTRAINT`, не всі присутні в `information_schema.table_constraints`.
- Сім нових колонок точно за таблицею [KR6.1 §2.3](kr6.1-discovery.md#23-що-з-цього-випливає-для-схеми):
  `weapon.mastery` (новий enum `WeaponMastery`, 8 значень), `feat.category`/`is_repeatable`,
  `background.ability_options`/`origin_feat_id`/`grants_gold_instead`, `class.epic_boon_level`.
  Жодної JSON-колонки.
- **Свідомо поза цим файлом** (описано в шапці SQL, не мовчки): 15 `*_2024`-походжень (потребують
  `UPDATE`, не схеми, і окремого рішення власника), консолідація суфіксних значень enum
  (`*_2024` у `BackgroundCategory`/`Races`), нові значення enum під самі 2024-сутності (це
  Крок 3 — обсяг визначає сід, не ця схема).

**SQL провалідовано, не лише написано.** Прогнано в `prisma.$transaction` проти `spells_test`:
усі DDL-рядки виконались без помилок, після чого сирим SQL (не Prisma-клієнтом — той ще не знає
про нові колонки до `db:pull`) вставлено другий рядок `background` з тим самим `name`, що вже
існує, але `ruleset = RULES_2024` — пройшло, довівши, що стара одинарна унікальність справді
знята, а нова складена справді дозволяє задумане. Транзакція навмисно завершена помилкою
(`ROLLBACK`), окремим запитом після підтверджено: `spells_test` не має жодного сліду (колонок,
типу `WeaponMastery`, зміненого індексу) — 90 походжень, як і було.

**Перевірено, не гірше базової лінії:** `bunx tsc --noEmit` і `bun run lint` — рахунок не зріс
(перевірено after цієї сесії, до комітів). Цільові тести (`tests/content/`,
`tests/database.test.ts`, `tests/golden/creation.test.ts`, `tests/golden/levelup/levelup.test.ts`,
`tests/actions/`) — зелені; повний прогін довший за 3 хв (golden levelup — багато послідовностей),
відповідає відомому попередженню хендофу про повільний повний `bun run test`, не стежить на
DB-тунель (локально тунеля й нема).

**Не зроблено цієї сесії, явно:** сід (Крок 3), `rules2024Strategy` (Крок 4), UI-перемикач
(Крок 5), сама 15-рядкова `UPDATE` і застосування SQL до жодної бази, крім рольбекнутої
транзакції на `spells_test`.

### 2026-08-16 — друга сесія: синхронізація тестових баз, прогін тестів та підготовка комміту Кроку 2

- **Синхронізація тестових баз:**
  - `spells_test` синхронізовано з проду через `./scripts/db-clone.sh spells_test`. Перевірено запитом до `information_schema.columns`: містить рівно 41/41 колонок (`ruleset` + 7 нових колонок Кроку 2).
  - `spells_ci_test` (CI-інфраструктура) синхронізовано з проду через `./scripts/db-clone.sh spells_ci_test` після підтвердження власника. Перевірено запитом: 41/41 колонок.
- **Верифікація тестів та типів:**
  - `bunx tsc --noEmit`: 2 базові помилки (в fixture `custom-asi-system.ts` та `prepared-spells.test.ts`), 0 нових.
  - Цільові тести (`tests/content/`, `tests/database.test.ts`, `tests/golden/creation.test.ts`, `tests/golden/levelup/levelup.test.ts`, `tests/actions/`): 17/17 файлів пройшли, 128/128 тестів зелені.
  - `bun run lint`: 0 помилок, 172 варнінги (точно відповідає базовій лінії).
- **Підготовка коміту:** змінені та нові файли Кроку 2 підготовлені й описані для рев'ю власником (`prisma/schema.prisma`, `db/schema.sql`, `db/changes/2026-08-16-kr6.3-2024-schema.sql`, 15 файлів `prisma/seed/*.ts`, `tests/golden/derived-state/attack-damage-bonuses.test.ts`). Жодних commit/push без дозволу не виконувалось.

### 2026-08-16 — третя сесія: Крок 3 (2024 сід у spells_test, in-place UPDATE 15 походжень, isolation-тести)

- **Нові enum-значення (SQL):**
  - Створено `db/changes/2026-08-16-kr6.3-step3-enum-values.sql` (13 `Classes` `*_2024`, 24 `Subclasses`, 27 `Feats`, 1 `WeaponCategory::PISTOL`).
  - Застосовано до `spells_test` через `db-tunnel.sh` (всі `ALTER TYPE ... ADD VALUE IF NOT EXISTS`).
  - `prisma/schema.prisma` оновлено через `db pull` з `spells_test` та `@prisma/client` згенеровано.

- **Сід 2024-контенту у `spells_test`:**
  - `prisma/seed/featSeed2024.ts`: 75 рис посіяно з `ruleset = RULES_2024`.
  - `prisma/seed/backgroundSeed2024.ts`: 1 нове походження (Acolyte) посіяно, з резолвінгом `Magic Initiate (Cleric)`.
  - `prisma/seed/update15ExistingBackgrounds2024.ts`: 15 наявних `*_2024` походжень оновлено на місці (in-place `UPDATE`, `background_id` 153..167 збережені, FK не зламано, `specialAbilityName` очищено, `originFeatId` зв'язано з 2024-рисами).
  - `prisma/seed/raceSeed2024.ts`: 10 видів/рас 2024 посіяно з `ruleset = RULES_2024`.
  - `prisma/seed/classSeed2024.ts`: 13 класів посіяно з `ruleset = RULES_2024`, `*_2024` enum-іменами, hitDie та multiclass reqs.
  - `prisma/seed/subclassSeed2024.ts`: 48 підкласів 2024 посіяно з прив'язкою до `classId` 2024-класів.
  - `prisma/seed/weaponSeed2024.ts`: 38 одиниць зброї 2024 посіяно з властивостями та `mastery`.
  - `prisma/seed/spellSeed2024.ts`: 391 заклинання 2024 посіяно з батчингом та зв'язками `SpellClasses`.
  - Загальний запуск через `scripts/seed-2024.ts`: 0 помилок на всіх 8 сутностях.

- **Ізоляційне тестування:**
  - Створено `tests/content/ruleset-2024-isolation.test.ts`:
    1. Цілісність та незмінність 2014-рядків на всіх таблицях.
    2. Присутність усіх 2024-рядків з явним `ruleset = RULES_2024`.
    3. Збереження `background_id` 153..167 після in-place `UPDATE`.
    4. Відсутність витоку 2024-контенту у `loadCharacterCreatorOptions()` та `getSpellsList()`.
  - Оновлено `tests/content/ruleset-server-filter.test.ts` для валідації реальних посіяних 2024-рядків.
  - Усі 60/60 тестів контенту (`tests/content/`) зелені:
    - `ruleset-2024-isolation.test.ts` (5 pass)
    - `ruleset-server-filter.test.ts` (10 pass)
    - `choice-option-integrity.test.ts` (1 pass)
    - `rules2024-import.test.ts` (44 pass)

### 2026-08-16 — четверта сесія: Крок 4 (`rules2024Strategy`, юніт-тести, controlled-red)

- **Реалізація контракту `RulesStrategy`:**
  - `src/rules/types.ts`: додано `epicBoonLevel?: number | null;` до `ClassProgression`, додано тип `BackgroundASIChoice` (`+2/+1` або `+1/+1/+1`).
  - `src/rules/strategies/types.ts`: розширено контракт `RulesStrategy` методами:
    - `needsSubclassSelection(progression, hasSubclass, level)`
    - `isAbilityScoreIncreaseLevel(progression, level)`
    - `isEpicBoonLevel(progression, level)`
    - `applySpeciesASI(scores, speciesASI?)`
    - `applyBackgroundASI(scores, allowedAbilities, choice)`
    - `validateBackgroundASI(allowedAbilities, choice)`
    - `getOriginFeatRequirement(background)`
  - `src/rules/strategies/rules2014.ts`: реалізовано методи для 2014 редакції (повна зворотна сумісність: підклас за `subclassLevel`, расовий ASI з `Race.ASI`, відсутність Epic Boon / background ASI / origin feat вимоги).
  - `src/rules/strategies/rules2024.ts`: реалізовано 2024-стратегію за PHB 2024:
    1. Підклас завжди на 3 рівні (`!hasSubclass && level >= 3`), `Class.subclassLevel` ігнорується.
    2. Feat/ASI на рівнях 4, 8, 12, 16 (та 6, 14 для Fighter; 10 для Rogue), а на 19 рівні — Epic Boon Feat (`isEpicBoonLevel = true`, `isAbilityScoreIncreaseLevel = false`).
    3. Вид не надає ASI (`applySpeciesASI` повертає незмінені бали).
    4. Походження надає вибір ASI: `+2/+1` або `+1/+1/+1` серед 3 характеристик походження, з обов'язковою стелею 20 (`Math.min(20, score + bonus)`).
    5. Походження вимагає обов'язкову Origin Feat 1-го рівня (`required: true`, передає `originFeatId`).
  - `src/lib/refs/classesBaseASI.ts`: додано 13 нових 2024-класів для повного покриття `Record<Classes, ...>`.

- **Юніт-тестування та Controlled-Red:**
  - Оновлено `tests/rules/coverage/rules-strategies.test.ts` (перевірка диспетчеризації та parity 2014-стратегії).
  - Створено `tests/rules/coverage/rules2024-strategy.test.ts` (13 тестів, що покривають усі розбіжності та граничні випадки).
  - **Controlled-Red proof:**
    1. Навмисне пошкоджено `needsSubclassSelection` у 2024 (читання `subclassLevel`) -> тест упав (RED), відновлено -> тест зелений (GREEN).
    2. Навмисне прибрано обмеження стелі 20 у `applyBackgroundASI` -> тест упав (RED: 21 != 20), відновлено -> тест зелений (GREEN).
  - Покриття `src/rules/` за `vitest.rules.config.mts`: **95.19% Stmts, 86.10% Branch, 96.66% Funcs, 97.80% Lines** (усі пороги >= 80% перевиконані).
  - Усі 17 тестових файлів `tests/rules/` (109 тестів), 4 файли `tests/content/` (60 тестів), `tests/golden/creation.test.ts`, `tests/database.test.ts` — **211/211 passed**.
  - `bun run lint`: 0 errors, 172 warnings (без зростання).
  - `bunx tsc --noEmit`: 0 errors.
  - `bun run check:db-boundary`: 0 violations.

- **Рішення про зміну послідовності перед Кроком 5:**
  - Власник погодив перерву перед Кроком 5 (UI-перемикач): спершу перевести всі повільні тести левелапу та правил (`tests/golden/levelup/`, `tests/rules/spell-slots.test.ts`, `tests/rules/hit-points.test.ts`) на чистий in-memory виклик `src/rules/` (`applyLevelUp` замість `executeLevelUp` з транзакціями у Postgres).
  - Це скоротить час прогону повного сьюту з кількох хвилин до кількох секунд та зніме блокування послідовного запуску `fileParallelism: false`.

### 2026-08-16 — п'ята сесія: Оптимізація швидкості тестів (In-Memory Rules & LevelUp)

- **Рефакторинг повільних тестів у чисті In-Memory:**
  1. `tests/golden/levelup/levelup.test.ts`: переведено всі 20 golden-послідовностей (1..20 рівні, 22 тести) на чистий виклик `applyLevelUp` з `src/rules/levelup.ts` та in-memory порівняння з JSON-знімками без жодного звернення до бази даних. Час виконання: **~38ms** (замість кількох хвилин/таймаутів транзакцій Postgres).
  2. `tests/rules/hit-points.test.ts`: переведено на чисті виклики `calculateInitialHitPoints`, `calculateAverageHitPointIncrease`, `calculateLevelUpHitPoints` з `src/rules/health.ts` та `calculateAbilityModifier` з `src/rules/abilities.ts`. Час виконання: **~2ms**.
  3. `tests/rules/spell-slots.test.ts`: переведено на чисті функції `calculateCasterLevel`, `getMaximumStandardSpellSlots`, `getMaximumPactSpellSlots`, `applySpellSlotMaximumDelta` з `src/rules/spellcasting.ts`. Час виконання: **~3ms**.
  4. `vitest.config.mts`: налаштовано паралельний прогін файлів `fileParallelism: true` (єдиним DB-тестом залишається `tests/database.test.ts`).

- **Результати верифікації:**
  - Повний прогін тестового набору (`bun run test`): **28 тестових файлів, 244 тести пройшли успішно за ~5-8 секунд** (0 помилок, 0 збоїв).
  - Покриття правил (`bun run test:rules:coverage`): **95.19% Stmts, 86.10% Branch, 96.66% Funcs, 97.80% Lines** (усі пороги >= 80% виконані).
  - `bun run lint`: 0 errors, 171 warnings.
  - `bunx tsc --noEmit`: 0 errors.
  - `bun run check:db-boundary`: 0 violations (368 modules, 1461 dependencies cruised).

### 2026-08-16 — шоста сесія: Крок 5 — UI-перемикач, правила створення 2024 та фіналізація KR6.3

- **Контроль доступу до PHB 2024 (`src/rules/access.ts`):**
  - Створено функцію `isRules2024Allowed(user)`.
  - Доступ до вибору 2024 правил надається лише за наявності дозволу: email власника (`lukagolota1@gmail.com`, `@holota.family`), змінні оточення `ADMIN_EMAIL` / `OWNER_EMAIL` / `ADMIN_EMAILS` або `ENABLE_RULES_2024="true"`.
  - Для всіх інших користувачів створення персонажа залишається суворо на PHB 2014.

- **Схема валідації та математика створення (`src/lib/zod/schemas/persCreateSchema.ts`, `src/rules/character-creation.ts`):**
  - Додано підтримку `ruleset` та `backgroundAsiChoice` (`+2/+1` або `+1/+1/+1`).
  - У `buildCreationAbilityScores`: у режимі 2024 расовий ASI дорівнює 0, бонус походження застосовується через `strategy.applyBackgroundASI` зі стелею 20.
  - Для 2014 поведінка та результати залишаються 100% незмінними.

- **UI-компоненти та інтеграція (`src/app/char/page.tsx`, `MultiStepForm.tsx`, `CharacterCreateHeader.tsx`, `BackgroundsForm.tsx`, `RacesForm.tsx`):**
  - У шапці створення додано перемикач `PHB 2014 / PHB 2024 (Власник)`, який рендериться лише якщо `canSelect2024 === true`.
  - Опції створення завантажуються динамічно за вибраним `ruleset` (`loadCharacterCreatorOptions({ ruleset })`).
  - У `MultiStepForm` перевірка `hasSubclasses` динамічно викликає `strategy.needsSubclassSelection(cls, false, 1)`.
  - У `BackgroundsForm` та `RacesForm` 2024-походження та 2024-види відображаються коректно та зручно у виділеній 2024-секції.

- **Збереження та серверний шар (`src/server/db/character-creation.ts`, `src/server/db/levelup-persistence.ts`):**
  - `createCharacter` валідує права доступу для 2024, зберігає `ruleset: RULES_2024` у таблицю `Pers`, прив'язує `originFeatId` походження до персонажа.
  - `getLevelUpInfo` використовує `pers.ruleset` для динамічного вибору стратегії правил.

- **Controlled-Red перевірка:**
  - Навмисно внесено регресію в `buildCreationAbilityScores` (застосування расового ASI у 2024 режимі) -> `tests/rules/creation-2024.test.ts` гарантовано впав (RED).
  - Код відновлено -> тест успішно пройдено (GREEN).

- **Фінальні результати перевірок:**
  - `bun run test`: **33 тестових файли, 265 тестів пройшли успішно за ~5.2s**.
  - `bun run test:rules:coverage`: **95.46% Stmts, 87.00% Branch, 96.73% Funcs, 97.95% Lines**.
  - `bunx tsc --noEmit`: **0 помилок**.
  - `bun run lint`: **0 помилок**, 171 попередження.
  - `bun run check:db-boundary`: **0 порушень** (369 модулів перевірено).

### 2026-08-16 — сьома сесія: Перевірка цілісності, валідація тестового середовища та чек-ліст релізу

- **Перевірка сідерів та унікальних ключів 2024:**
  - Перевірено складені унікальні ключі `@@unique([name, ruleset])` та `@@unique([engName, ruleset])` у `prisma/seed/*Seed2024.ts` та `scripts/seed-2024.ts`.
  - Усі 2024 сідерні операції ізольовані суворо значенням `ruleset: "RULES_2024"` та не зачіпають `RULES_2014` записи.
  - 15 наявних `*_2024` походжень (IDs 153–167) оновлюються in-place без створення нових/дублюючих записів та без порушення FK зв'язків з живими персонажами.

- **Повний прогін валідації:**
  - `bun run test`: 33 тестові файли, 265 тестів зелені (~5.9s).
  - `bun run test:rules:coverage`: 95.46% Stmts, 87.00% Branch, 96.73% Funcs, 97.95% Lines.
  - `bunx tsc --noEmit`: 0 помилок.
  - `bun run lint`: 0 помилок, 171 попередження (базова лінія).
  - `bun run check:db-boundary`: 0 порушень (369 модулів перевірено).

- **Підготовлено детальний чек-ліст продакшн-викочування для власника.**
