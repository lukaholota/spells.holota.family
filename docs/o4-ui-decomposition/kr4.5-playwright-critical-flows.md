# KR4.5 — Playwright для критичних наскрізних флоу

**Ціль:** [O4](README.md) · **Статус:** ✅ зроблено 2026-08-15 · **Залежить від:** KR4.2–KR4.4

## Scope

Довести Playwright від двох public smoke-кейсів до приблизно десяти стабільних критичних
сценаріїв. Пріоритет — constructor з різними наборами кроків, level-up і найбільш ризикові
екрани, знайдені KR4.3/KR4.4. Для конструктора браузер звіряє rendered step ids/order/disabled
state з oracle KR4.2. Не будувати 100 тестів, не додавати RTL/jsdom і не тестувати правила
через браузер.

## Runtime-послідовність

1. Окремо завершити та перевірити будь-який cross-cutting refactor, щоб Next server компілювався.
2. Підняти і перевірити локальний `spells_test` tunnel.
3. Запустити всі 10 Playwright cases; лише green runtime result закриває KR4.5.

Це не переносить Playwright раніше за resolver KR4.2: browser oracle лишається останньою
інтеграційною перевіркою вже стабілізованого worktree.

## Baseline

`tests/e2e/smoke.spec.ts` містить два unauthenticated cases: home navigation та `/spells`.
`playwright.config.ts` примусово задає guarded `DATABASE_URL` із `.env.test` і порт 3100.
Прогін не виконано в цій планувальній сесії: `db-tunnel.sh --status` повернув «тунелю немає».

## Готово, коли

- [x] Є 10 сценаріїв: 2 public smoke (home navigation, `/spells`) і 8 constructor checks. Вісім фіксують core order, disabled forward, Dwarf subrace branch, Human variant branch і Human → Ranger level-1 class-choice branch; це не дублікати «сторінка відкрилась».
- [x] Constructor checks імпортують `resolveCreationSteps` і порівнюють DOM `data-step-id` у порядку oracle; покриті normal core і dynamic Dwarf/Human/Ranger branches, а forward перевіряється до й після необхідного вибору.
- [x] Playwright не стартує проти production DB: existing URL assertion лишився; controlled-red `DATABASE_URL=…/spells bunx playwright test --list` відхилено guard-ом до запуску сервера.
- [x] Runtime Playwright пройшов через локальний `spells_test` tunnel: 10/10 green за 17.5 s; trace лишається `on-first-retry`.

## Ризики й стримування

Ризик — flaky UI suite та селектори, зчеплені з копією markup. Стримування: малий набір,
семантичні або test-id селектори там, де текст неоднозначний, one flow per test і oracle з KR4.2.
Ризик production data стримується існуючим `assertTestDatabaseUrl`, обов'язковим tunnel status і
відсутністю login/data-mutation сценаріїв, доки їхня ізоляція окремо не доведена.

## Журнал

2026-08-15 — план створено. Збережено два наявні smoke-тести як tooling proof, не видано їх за
готовий suite Р7.

2026-08-15 — додано `creation.spec.ts`: разом зі збереженим `smoke.spec.ts` suite має 10
неавторизованих cases. Constructor tests беруть exact order тільки з pure
`resolveCreationSteps`, а DOM читають через `data-step-id`; `data-active` і submit button
покривають disabled-state. Stable test IDs прив'язані до вже наявних domain identifiers race,
subrace, class і variant, без текстових селекторів або нової UI abstraction. У browser-flow
покрито core normal, Dwarf підраси, Human variants і Human → Ranger level-1 class choices.
Level-up не додано як фальшивий «route opens» case: без ізольованого test character він або
читає невідомий живий fixture, або робить заборонену KR mutation; це поза поточним доказаним
scope.

2026-08-15 — controlled-red safety proof: `DATABASE_URL=…/spells bunx playwright test --list`
завершився red у `assertTestDatabaseUrl` до старту server. Green static checks:
`bunx playwright test --list tests/e2e` (10 cases), targeted ESLint (0 errors; 32 pre-existing
unused-import warnings у legacy creator components), resolver oracle Vitest (10/10). Full
`bunx tsc --noEmit` має тільки відомі blockers у
`tests/fixtures/builds/custom-asi-system.ts:20` і `tests/rules/prepared-spells.test.ts:30`.
`./scripts/db-tunnel.sh --status` повернув «тунелю немає», тому runtime E2E та DB/golden tests
не запускалися; CI не перевірявся з локального worktree.

2026-08-15 — повторна runtime verification: `./scripts/db-tunnel.sh --status` завершився з
`exit 1`; серед sandbox diagnostics (`sysmond service not found`, `pgrep: Cannot get process
list`) скрипт підтвердив фінальним рядком «тунелю немає». За правилом KR runtime
`bun run test:e2e` не запускався: немає безпечного доступу до локальної `spells_test`, а обхід
суперечив би guard-у та scope. KR4.5 лишається `☑ implementation`; runtime результат ще не
підтверджений.

2026-08-15 — test tunnel успішно піднято штатним `./scripts/db-tunnel.sh`:
`127.0.0.1:5454 → srvh:5432`. Повний `bun run test:e2e` запущено через цей tunnel, але жоден
case не стартував: Next dev server не компілює layout до рендеру route. Причина — поточні
незакомічені action shims `src/lib/actions/pers.ts` і `spell-actions.ts`: у `"use server"` вони
роблять `export *` з `src/server/db/*`, а Next 16 дозволяє там лише async exports. Наслідок для
`SpellInfoModal`: exports `getSpellForModal`, `setSpellPresenceForPers` і
`getUserPersesSpellIndex` не існують у client bundle. Це не E2E/oracle red і поза вузьким scope
KR4.5 (server actions / production UI не змінювались); потрібна окрема правка власника цих
незакомічених змін, після якої слід повторити повний runtime run.

2026-08-15 — порядок уточнено: implementation E2E лишається після KR4.2–KR4.4, але runtime
verification є фінальним integration gate, не перевіркою посеред незавершеного cross-cutting
refactor. Спершу стабілізується компільований Next server, потім `spells_test` tunnel і повний
browser run; лише це дає підставу закрити KR4.5.

2026-08-15 — завершено prerequisite boundary refactor. Усі pure compatibility barrels, що
re-export’ять `src/server/db/*`, більше не дублюють `"use server"`: directive вже стоїть у
фактичних implementation modules. У `levelup.ts`, який також має власний action, named re-export
замінено на async forwarder з тією самою сигнатурою. Це зняло Next 16 compile error до рендеру
client routes; action logic, Prisma і rules не змінювались.

2026-08-15 — runtime triage знайшов два KR4.5 defects. Parent `MultiStepForm` перетирав
validation callback дочірньої race form і робив initial «Далі →» enabled; reset прибрано.
Controlled-red: тимчасове повернення reset дало focused Playwright red саме на
`toBeDisabled`, після відновлення fix full suite знову green. Ranger test expectation доповнено
`hasLanguageChoice`: Ranger 2014 має level-one choice додаткової мови, тому rendered 10-step
branch відповідає pure resolver, а не спрощеному 9-step expectation.

2026-08-15 — фінальна runtime verification: `./scripts/db-tunnel.sh --status` green
(`127.0.0.1:5454 → srvh:5432`), `bun run test:e2e` — **10 passed (17.5 s)**. Targeted ESLint
для змінених actions/UI/E2E green; targeted `tests/actions/spell-actions.test.ts` через
`spells_test` — 1/1 green; `git diff --check` green. `bunx tsc --noEmit` має тільки відомі
blockers: `tests/fixtures/builds/custom-asi-system.ts:20` (string замість number для ASI value)
і `tests/rules/prepared-spells.test.ts:30` (`number | undefined` замість `number`); вони не
змінювались. KR4.2 golden blocker лишається окремим і не чіпався: creation golden 34/35,
`dwarf-tasha-flexible-asi` red через три відсутні dwarven tool proficiencies.

2026-08-15 — closure audit O4 повторив runtime suite через штатний `spells_test` tunnel:
`bun run test:e2e` — **10 passed (17.2 s)**. Це підтверджує KR4.5 на поточному worktree;
KR4.2 creation golden blocker лишається окремим.
