# KR5.2 — `ruleset` у схемі з безпечним default

**Ціль:** [O5](README.md) · **Статус:** ✅ закрито 2026-08-15 · **Залежить від:** KR5.1 boundary/provenance; Р1–Р3.

## Мета

Додати редакцію правил як вимір однієї схеми, не змінюючи чинну поведінку D&D 5e 2014. Усі наявні й нові рядки без явно вказаної редакції мають отримувати `RULES_2014`.

## Узгоджений scope

`Ruleset` — PostgreSQL enum: `RULES_2014`, `RULES_2024`.

Колонка `ruleset Ruleset NOT NULL DEFAULT RULES_2014` потрібна на `pers` і на content-моделях:

- кореневі: `background`, `class`, `subclass`, `race`, `race_variant`, `subrace`, `feat`, `feature`, `spell`, `creature`, `armor`, `weapon`, `equipment_pack`, `infusion`, `magic_item`, `fighting_style`, `choice_option`;
- content-зв’язки: `choice_option_feature`, `class_choice_option`, `class_feature`, `class_optional_feature`, `class_optional_feature_replaces_feature`, `class_starting_equipment_option`, `subclass_choice_option`, `subclass_feature`, `feat_choice_option`, `race_choice_option`, `race_choice_option_trait`, `race_trait`, `race_variant_trait`, `subrace_trait`, `spell_classes`, `spell_races`.

Зв’язки теж мають власний discriminator: інакше спільний контент не може мати різні редакційні зв’язки (наприклад, доступність заклинання класу) без втрати редакції самого зв’язку.

## Поза межами

- UI, runtime selection і фільтрація query paths;
- seed або імпорт 2024-контенту, `data/2024/source/` та `../char2024`;
- зміна golden JSON чи чинної 2014-логіки;
- ручне редагування `prisma/schema.prisma`, `prisma db push`, migrations або самостійний SQL до production.

## Готово, коли

- [x] Мінімальний перелік таблиць визначено через schema/content repositories; неіндексований Graph MCP задокументовано як fallback.
- [x] SQL provenance підготовлено: [`db/changes/2026-08-15-add-ruleset.sql`](../../db/changes/2026-08-15-add-ruleset.sql).
- [x] Власник застосував SQL до цільової БД і підтвердив результат.
- [x] Після owner apply виконано `bun run db:pull`; generated schema та schema dump оновлені лише цим шляхом.
- [x] Contract-тест доводить default `RULES_2014` у `spells_test` (5/5).
- [x] Перевірено target diff, typecheck/lint і доречні тести; golden-diff записано окремо без маскування чужої зміни.

## Журнал

2026-08-15 — обов’язкові `CLAUDE.md`, `docs/README.md`, `docs/DECISIONS.md` (особливо Р1–Р3), O5 README, KR5.1 з журналом і `KNOWN-BUGS.md` прочитано повністю. Окремого session handoff/journal не знайдено. Graph MCP перевірено, але цей репозиторій не індексований; застосовано дозволений fallback через Prisma schema й `src/server/db/` repositories.

2026-08-15 — проаналізовано `creation-content`, `class-content`, `spell-actions` і Prisma-моделі. Чинні query paths не мають `ruleset` filter; це безпечно тільки доки всі рядки отримують default `RULES_2014`. `NOT NULL DEFAULT RULES_2014` заповнює наявні 2014 записи без ручного backfill та зберігає результат чинних query paths. Додано лише owner-apply SQL; SQL не застосовувався, `db:pull` не запускався.

2026-08-15 — `git diff --exit-code -- tests/golden` повертає 1 через наявну чужу зміну `describe` → `describe.sequential` у `tests/golden/levelup/levelup.test.ts`; golden-файли не змінювалися в KR5.2.

2026-08-15 — owner застосував `db/changes/2026-08-15-add-ruleset.sql`. `bun run db:pull` успішно introspect-нув production schema та згенерував Prisma client; спершу фінальний `db:dump` зупинився на локальному `pg_dump` 14 проти server 17. Після встановлення PostgreSQL 17 client `bun run db:dump` завершився: 65 таблиць, 36 enum types, 5405 рядків. `prisma/schema.prisma` і `db/schema.sql` змінені лише цим workflow.

2026-08-15 — для contract test запущено штатний `./scripts/db-clone.sh spells_test content`. Production `spells` прочитано, але скрипт упав на `CREATE DATABASE` з `permission denied`: роль `char_app` не має `CREATEDB`. Оскільки скрипт робить `DROP DATABASE spells_test` перед `CREATE`, тестова БД імовірно видалена; її має відновити owner/admin role тим самим clone workflow. Нові DB-права для `char_app` не надавалися. До відновлення `spells_test` DB-contract test не запускався.

2026-08-15 — додано мінімальний contract test у `tests/database.test.ts`: наявний `class` і новий `pers` без явного `ruleset` мають `RULES_2014`. Він не запускався, бо `spells_test` блокується вище. `bun run lint` завершився успішно з 172 наявними warnings. `bunx tsc --noEmit` зараз падає поза KR5.2: `tests/fixtures/builds/custom-asi-system.ts:20` (string замість number) і `tests/rules/prepared-spells.test.ts:30` (`number | undefined`).

2026-08-15 — owner тимчасово надав `char_app CREATEDB`, після чого штатний clone відновив `spells_test` із production schema/content. `bunx vitest run tests/database.test.ts` — 5/5 green, включно з default `RULES_2014` для наявного content та нового `pers`. Owner підтвердив `ALTER ROLE char_app NOCREATEDB`; глобальне право не лишилось увімкненим. KR5.2 закрито; O5 і надалі не закрито (1/5).
