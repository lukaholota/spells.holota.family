# KR4.2 — Винести resolver кроків конструктора

**Ціль:** [O4](README.md) · **Статус:** ✅ зроблено 2026-08-15 · **Залежить від:** KR4.1

## Scope

Винести з `MultiStepForm` лише детермінований вибір і порядок step descriptors у pure,
предметний resolver. Його вхід — уже обчислені булеві умови, вихід — id/name/order кроків.
Рендеринг, zustand/react-hook-form, server action, навігація та самі форми лишаються в
`MultiStepForm`. Не перетворювати форми на registry або загальний workflow framework.

## Baseline

`MultiStepForm.tsx` має 1 093 рядки, один production caller і 14 механічних рівнів вкладеності.
У ньому зібрано до 17 кроків `dynamicSteps.push(...)`. Golden builds покривають creation output,
але не експортують точний список намальованих кроків; тому Playwright не має oracle для нього.

## Готово, коли

- [x] resolver має тест-кейс для кожної умовної осі та комбінованого longest path; тест перевіряє повний ordered список id, не лише count.
- [x] `MultiStepForm` використовує тільки цей resolver для списку кроків; порядок і назви не змінилися.
- [x] Критичні O2 creation golden тести зелені, JSON byte-stable.
- [x] Controlled-red: змінений id або порядок у resolver-і робить точний тест червоним, після чого зміну відновлено.

## Ризики й стримування

Ризик — комбінаційна регресія: зниклий, переставлений або передчасний крок. Стримування —
табличні pure assertions для окремих осей плюс longest path, незмінні O2 golden fixtures і
малий PR без жодної зміни вибраних даних. Ризик «нова архітектура» стримується одним конкретним
resolver-ом для одного caller-а; він не є generic step engine.

## Журнал

2026-08-15 — план створено. Виявлено, що exact step oracle ще не існує поза компонентом.

2026-08-15 — додано `creation-step-resolver.ts`: pure `resolveCreationSteps` приймає 13 уже
обчислених boolean-умов і повертає ordered `{ id, name, component }[]`. `MultiStepForm` передає
ті самі умови до resolver-а; rendering, store, navigation і форми не рухались. Pure oracle має 10
assertions: subrace, variant, subrace+variant, race choices, class/subclass choices, variant feat
та choice options, background feat та choice options, expertise+languages, longest path і три
варіанти назви race details. Controlled-red: тимчасова перестановка `equipment`/`name` зробила
9 exact-order cases red; порядок відновлено, tests green.

`bunx vitest run tests/golden/creation.test.ts` через `spells_test`: 34/35 green, golden JSON не
змінювались. Єдиний red — `dwarf-tasha-flexible-asi`: поточний output не містить трьох dwarven
tool proficiencies, наявних у fixture. Це не може походити від KR4.2, бо resolver не викликає
`createCharacter` і не змінює його дані; fixture не оновлювався.

2026-08-15 — closure audit O4 підтвердив актуальні non-DB докази: UI guard без violations і
13 focused resolver/component proofs green. O4 не закрито, бо формальний критерій KR4.2 про
зелений creation golden досі не виконано. Після штатного підняття `spells_test` tunnel повторний
прогін підтвердив 34/35: єдиний red — той самий `dwarf-tasha-flexible-asi` із трьома відсутніми
dwarven tool proficiencies. Golden JSON не змінювались. Це точний closure blocker, а не наслідок
resolver-а.

2026-08-15 — за явним дозволом власника розслідувано й виправлено blocker: DB-boundary refactor
парсив JSON-поле `Race.toolProficiencies` тільки як enum-масив і відкидав локалізовані dwarf
strings. Legacy action передавав це JSON напряму formatter-у. `formatToolProficiencies` тепер
приймає validated `string[]`, а `createCharacter` передає `parseStringArray(race.toolProficiencies)`;
class/subrace/feat enum paths не змінені. Новий DB-backed characterization test red до fix,
red при навмисному поверненні enum parser-а та green після restore. Повний creation golden —
35/35 green без зміни JSON; focused resolver/component proofs — 13/13 green; Playwright —
10/10 green за 19.9 s. KR4.2 і O4 закрито.
