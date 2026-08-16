# KR5.3 — `src/rules/` розділено на спільне ядро та стратегії 2014/2024

**Ціль:** [O5](README.md) · **Статус:** ✅ закрито 2026-08-15 · **Залежить від:** закритих O3
(KR3.1-3.6) та KR5.2 (`Ruleset` enum у схемі).

## Мета

Дати `src/rules/` явну межу між кодом, спільним для обох редакцій, і кодом, де редакції справді
розходяться — не змінюючи жодного 2014-результату і не додаючи 2024-механіку чи вибір редакції в
рантаймі. Це підготовчий крок для [KR5.4](README.md) (контент 2024) і [KR5.5](README.md) (вибір
редакції в UI) — сам KR5.3 нічого з цього не вмикає.

## Аналіз перед зміною

`src/rules/` (KR3.1-3.6) — 9 плоских файлів, 727 рядків: `abilities`, `armor`, `health`,
`proficiency`, `progression`, `spellcasting`, `levelup`, `character-creation`, `types`. Публічний
API читають п'ять callers: `src/lib/logic/{bonus-calculator,spell-logic,utils}.ts`,
`src/server/db/{character-creation,levelup-persistence}.ts` — усі через `@/rules/*`.

Звірено з таблицею розбіжностей у [O5 README](README.md#де-правила-справді-розходяться):

| Розбіжність з таблиці | Чи є в `src/rules/` код-рівнева розбіжність? |
|---|---|
| Раса/вид дає ASI | Ні — вже параметризовано даними: порожній ASI-блок раси природно дає нуль бонусу, коду для 2024 не треба |
| Підклас: рівень залежить від класу (1/2/3) проти завжди 3 | **Так** — `progression.ts#needsSubclassSelection` читає `progression.subclassLevel` з контенту; 2014-правило «довіряй полю даних», 2024-правило «ігноруй поле, завжди 3» — це різна *логіка*, не тільки різні дані |
| Походження: навички проти +2/+1 ASI + origin feat | Не в `src/rules/` — `CreationAbilityInput` взагалі не знає про background; додати цей вхід без реальної 2024-механіки означає вигадати недоведений API. Залишено для KR5.4 |
| Майстерність зброї | Немає в `src/rules/` взагалі — нова 2024-механіка, поза межами KR5.3 |
| Заклинання | Контентна, не `src/rules/`-механіка — поза межами |

Висновок: єдина точна, live, code-рівнева розбіжність, що вже існує в `src/rules/` і активно
викликається рантаймом (`levelup-persistence.ts` → `getLevelUpInfo`) — це `needsSubclassSelection`.
Решта таблиці або вже суто контентна, або взагалі не змодельована (свідомо, це не сфера KR5.3).
Розширювати межу вигаданими методами під розбіжності, яких ще немає в коді, — це саме той
"переписати за PHB з нуля" ризик, від якого застерігає [KR3.1](../o3-rules-engine/kr3.1-rules-module.md#пастка).

## Узгоджений scope

Нове дерево, чисто додаткове — жоден із 9 наявних файлів `src/rules/` не змінено і не переміщено,
вони й лишаються спільним ядром без жодного файлового переїзду (ризик такого переїзду — 5 callers,
без користі для 2014-результату):

```
src/rules/strategies/
  types.ts      RulesetId ("RULES_2014" | "RULES_2024") + RulesStrategy — локальний literal type,
                не імпорт @prisma/client (ESLint і так забороняє це в src/rules/**)
  rules2014.ts  rules2014Strategy — просто делегує в наявний progression.ts#needsSubclassSelection,
                нуль нової логіки
  rules2024.ts  rules2024Strategy — non-runtime scaffold: needsSubclassSelection кидає
                Rules2024NotImplementedError. Жодної 2024-механіки не закодовано навіть як
                заглушка — навмисно, щоб не видати вигадане правило за 2024
  index.ts      getRulesStrategy(ruleset) — реєстр, чисте табличне диспетчування
```

Єдина зміна в наявному рантаймі: `src/server/db/levelup-persistence.ts` — виклик
`needsSubclassSelection(...)` замінено на `activeRulesStrategy.needsSubclassSelection(...)`, де
`activeRulesStrategy = getRulesStrategy("RULES_2014")` — module-level константа, жодного runtime
вибору редакції, жодного читання `pers.ruleset` чи UI. `isAbilityScoreIncreaseLevel` не займали:
розбіжності 2014/2024 у ньому не знайдено (класові рівні ASI однакові в обох редакцій).

## Поза межами

- UI, runtime ruleset selection, читання `pers.ruleset`/`Ruleset`-фільтрів у query paths.
- Будь-яка 2024-механіка чи контент (origin feats, weapon mastery, background ASI, перероблені
  заклинання) — `rules2024.ts` навмисно порожній, лише кидає помилку.
- Переміщення наявних 9 файлів `src/rules/` у підпапки (`abilities/`, `health/` тощо з чернетки
  KR3.1) — цей переїзд ризикує callers заради нульової користі для самої межі стратегій.
- Зміна `isAbilityScoreIncreaseLevel`, `getInitialSpellSlots` чи будь-якої іншої функції
  `src/rules/`, де розбіжності редакцій не знайдено.
- Golden JSON, seed, `data/2024/source/`, `../char2024`.

## Готово, коли

- [x] Чітка test-covered межа shared core / 2014 strategy / 2024 strategy scaffold —
  `tests/rules/coverage/rules-strategies.test.ts`, без БД.
- [x] Усі чинні runtime callers і далі використовують лише `RULES_2014` — єдиний caller
  (`levelup-persistence.ts`) викликає хардкоджений `getRulesStrategy("RULES_2014")`; 2024 ніде не
  видно в UI чи даних.
- [x] 2014-результати не змінилися — доведено targeted тестами нижче, без `UPDATE_GOLDEN`.
- [x] Перевірено target diff, lint, typecheck і тести; наявні typecheck/golden blockers
  зафіксовані окремо, не замасковані.
- [x] Закрито лише KR5.3. O5 і далі не закрито (2/5).

## Characterization / controlled-red proof

`rules2014Strategy.needsSubclassSelection` — чиста делегація до наявної
`progression.ts#needsSubclassSelection`; новий тест звіряє їх результат по-байтово на п'яти
кейсах (subclassLevel 1/2/3, дефолт, межовий рівень).

**Controlled-red, виконано 2026-08-15:** тимчасово (1) поміняно місцями `RULES_2014`/`RULES_2024` у
реєстрі `strategies/index.ts` і (2) `rules2024Strategy.needsSubclassSelection` змінено з `throw` на
`return false`. `bunx vitest run --config vitest.rules.config.mts tests/rules/coverage/rules-strategies.test.ts`
впав 2 з 3 (dispatch-тест і non-runtime-scaffold-тест), третій (byte-parity 2014) лишився зеленим,
бо не залежить від реєстру. Обидва файли відновлено з backup, той самий прогін — 3/3 green.

## Журнал

2026-08-15 — прочитано повністю: `CLAUDE.md`, `docs/README.md`, `docs/DECISIONS.md` (Р1-Р3),
[O5 README](README.md), [KR5.1](kr5.1-source-snapshot.md) з журналом, [KR5.2](kr5.2-ruleset-schema.md)
з журналом, [KNOWN-BUGS.md](../KNOWN-BUGS.md). Session handoff/journal-файлу для KR5.3 не знайдено.

2026-08-15 — Graph MCP перевірено: цей репозиторій не індексований (`search_graph`/
`get_architecture` не повертають нічого для проєкту). Застосовано дозволений fallback: пряме
читання `src/rules/*.ts` і `grep`/`rg` по callers замість графа.

2026-08-15 — прочитано всі 9 файлів `src/rules/` і п'ять caller-файлів повністю; звірено з
таблицею розбіжностей O5 README. Висновок аналізу — секція вище. Єдина знайдена live-розбіжність:
`needsSubclassSelection`.

2026-08-15 — додано `src/rules/strategies/{types,rules2014,rules2024,index}.ts`, чисто додатково.
`levelup-persistence.ts` переведено на `getRulesStrategy("RULES_2014")` — один рядок виклику, один
імпорт прибрано (`needsSubclassSelection` напряму), один доданий (`getRulesStrategy`).

2026-08-15 — `bun run test:rules:coverage`: 11/11 (було 8/8 до KR5.3), agregate coverage
95.43/85.46/97.4/98.27 (stmt/branch/func/lines) — трохи вище за baseline KR3.5
(95.32/85.46/97.29/98.22), бо нові файли `strategies/` покриті повністю; жодного файлу з 0%
у `coverage-final.json` (перевірено списком файлів, усі 4 нових присутні).

2026-08-15 — controlled-red виконано й задокументовано вище; обидва мутовані файли відновлено з
backup, повторний прогін підтвердив відновлення.

2026-08-15 — `./scripts/db-tunnel.sh --status` повернув «тунелю немає» (exit 1) — відомий
false-negative з попереднього journal через застарілий `pgrep`-патерн скрипта. Перевірено напряму:
`lsof -iTCP:5454 -sTCP:LISTEN` показав живий `ssh` (pid 6144, `launchctl` label
`com.holota.spells-db-tunnel`), тобто тунель насправді працює. `.env.test` вказує на `spells_test`
через цей тунель. DB-тести запущено на цій підставі, без будь-якого доступу до production.

2026-08-15 — targeted DB-proof, file-serial проти `spells_test`: `tests/golden/levelup/levelup.test.ts -t "fighter6-wizard14"`
— 2 passed, 20 skipped, golden JSON не змінилися (byte-stable). `tests/actions/legacy-level-up.test.ts`
— 1/1 green; цей тест напряму викликає `getLevelUpInfo` з `src/app/actions/level-up.ts`, який
ре-експортує з `levelup-persistence.ts`, тобто проходить саме крізь змінений виклик
`activeRulesStrategy.needsSubclassSelection`.

2026-08-15 — `bun run lint`: 0 errors, 172 warnings — той самий рахунок, що зафіксований у вхідному
стані сесії; нових попереджень від нових файлів немає (жодного `as any`, жодної невикористаної
змінної). `bunx tsc --noEmit`: лишилися рівно ті самі два відомі test-only errors
(`tests/fixtures/builds/custom-asi-system.ts:20`, `tests/rules/prepared-spells.test.ts:30`) — не
замасковані, не зачеплені цією роботою. `bun run check:db-boundary`: green, 368 модулів (було
менше — приріст рівно на нові файли `strategies/`), 0 порушень.

2026-08-15 — `git diff --exit-code -- tests/golden` як і раніше падає лише через чужу
`describe` → `describe.sequential` заміну в `tests/golden/levelup/levelup.test.ts`
(задокументовано в KR5.2); жодного golden JSON KR5.3 не торкнувся. `git status` для
`src/rules/strategies/`, зміненого рядка в `levelup-persistence.ts` і нового
`tests/rules/coverage/rules-strategies.test.ts` — рівно очікувані файли, нічого чужого не
перезаписано.

2026-08-15 — KR5.3 закрито. `docs/o5-rules-2024/README.md` оновлено: статус KR5.3, посилання на
цей файл, O5 прогрес 1/5 → 2/5. Коміт не робився — за інструкцією сесії.
