# KR3.1 — Модуль `src/rules/`

**Ціль:** [O3](README.md) · **Статус:** ✅ завершено 2026-08-14 · **Залежить від:** O2

## Навіщо

Потрібне одне місце, де живе математика D&D і де немає нічого іншого. Поки правила перемішані з
запитами до бази, кожен тест на правило тягне за собою Postgres, а кожна зміна правила ризикує
зачепити збереження.

## Що переїжджає

`src/lib/logic/` (2291 рядок) — уже майже те, що треба, але не чисте. Перевірено 2026-08-07:

| Імпорт | Файлів | Вирок |
|---|---|---|
| `@prisma/client` | 8 | типи й enum-и — **лишається**, це не рантайм |
| `@/lib/refs/translation` | 3 | чисті дані — лишається |
| `@/lib/types/model-types` | 2 | типи — лишається |
| `@/lib/prisma` | 2 | **вирізати** — піднімає Pool при імпорті |
| `@/lib/actions/pers` | 2 | **вирізати** — тягне next-auth і next/cache |

Плюс усе, що зараз розчинене всередині `character.ts`, `levelup.ts`, `bonus-calculator.ts`.

## Готово, коли

- [x] `src/rules/` існує, розбитий по темах (характеристики, HP, AC, слоти, вміння, прогресія)
- [x] у ньому нуль імпортів `@/lib/prisma`, `next/*`, `@auth/*`, `server-only`
- [x] Prisma enum-и й типи не входять у публічні inputs `src/rules/`
- [x] кожна функція детермінована: ті самі входи → той самий вихід, без дат і без випадковості
- [x] тести на `src/rules/` ганяються без тестової БД
- [x] ESLint забороняє заборонені імпорти в `src/rules/`

## Форма

Вхідні дані — звичайні структури, не Prisma-моделі. Правилам не має бути важливо, звідки взявся
клас: із бази, з фікстури чи з літерала в тесті.

```
src/rules/
  abilities/     модифікатори, ASI, розподіл
  health/        HP на 1 рівні й на левелапі, кістки хітів
  armor/         AC з усіх джерел
  spellcasting/  слоти, рівень кастера, мультиклас, пакт
  proficiency/   бонус майстерності, навички, рятівні, експертиза
  progression/   що клас дає на якому рівні
  types.ts       вхідні структури — власні, не з Prisma
```

## Пастка

Спокуса зробити `src/rules/` «правильним з нуля» і переписати логіку за PHB. **Не робити.**
На цьому етапі правила переносяться **як є**, разом з усіма багами. Golden-файли з O2 мають
лишитися зеленими байт-у-байт. Виправлення — окремим кроком, після переїзду.

## Журнал

**2026-08-14, основний перенос KR3.1.** Додано `src/rules/` із власними plain inputs: abilities,
proficiency, health, armor, spellcasting і progression. Legacy код лишився adapter-шаром:
`utils.ts`, `spell-logic.ts`, `bonus-calculator.ts`, `character.ts` і `levelup.ts` делегують у
чисті rules-функції, а Prisma/Next/DB не перетікають усередину rules.

`tests/rules/rules-module.test.ts` працює без БД. Контрольований red: тимчасове очікування HP 19
впало з фактичним 20, після чого 20 відновлено. Під час переносу caster level rules-test виявив
важливу legacy-семантику: class `NONE` мусить дозволити third-caster subclass; її збережено,
після чого rules і slot/rest golden зелені. BUG-001…011, Prisma schema і golden JSON не змінювалися.

Перевірка: pure `rules-module.test.ts` — 6 passed; релевантні DB/rules/golden suites — зелені,
зокрема AC, HP, class progression, spell slots і rest/slots (4 чинні expected fails); `bun run lint`
— 0 errors, 359 warnings; `git diff --check` — зелений. Повний `bun run test` був запущений через
`spells_test` tunnel, а `git diff --check` — зелений. Агрегований `bun run test` у цьому
середовищі не повертає status для довгого дочірнього Vitest-process, тому доказом лишаються
окремі серійні pure та DB/golden runs вище; golden JSON не змінювалися.
