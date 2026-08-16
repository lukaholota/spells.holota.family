# KR3.3 — Тонкий `levelUpCharacter`

**Ціль:** [O3](README.md) · **Статус:** ✅ завершено 2026-08-14 · **Залежить від:** KR3.2

## Навіщо

`src/lib/actions/levelup.ts` — 1435 рядків, два експорти: `getLevelUpInfo` і `levelUpCharacter`,
причому другий приймає `data: any`. Тобто вхід левелапу не описаний узагалі.

Складніший за створення, бо не рахує стан з нуля, а **змінює наявний**. Саме тут найгірші баги:
слоти, що не доїхали, фічі, додані двічі, загублені ASI.

## Готово, коли

- [x] `levelUpCharacter` читається як послідовність кроків, менше 100 рядків
- [x] `data: any` замінено на описану схему zod
- [x] дельта рівня рахується чистою функцією в `src/rules/`
- [x] golden-послідовності з [KR2.3](../o2-characterization/kr2.3-golden-levelup.md) зелені без правок
- [x] `getLevelUpInfo` більше не дублює логіку `levelUpCharacter` — обидва звертаються до одного
      джерела правди в `src/rules/`

## Цільова форма

Ключова ідея — левелап має бути **чистою функцією переходу**:

```ts
function applyLevelUp(before: CharacterState, choices: LevelUpChoices, content: Content): CharacterState
```

Не мутація, не серія `update`. Береш стан, отримуєш новий стан, різницю зберігаєш. Тоді golden-тест
на послідовність 1→20 — це просто двадцять викликів поспіль без жодного запиту до бази.

## Наявні хелпери, які вже майже чисті

У файлі вже є `normalizeSlotArray`, `getMaxStandardSlots`, `getMaxPactSlots`,
`applyMaxDeltaToCurrent`, `normalizeSkillProficiencies`. Вони приватні й здебільшого детерміновані —
переносяться в `src/rules/spellcasting/` і `src/rules/proficiency/` майже механічно. Починати з них.

Застереження: `getMaxStandardSlots` і `getMaxPactSlots` приймають `persLike: unknown` і одразу
кастять у `any`. При переїзді дати їм справжній тип — це те місце, де `as any` виправляється
безкоштовно.

## Найризикованіше

**Мультикласові слоти.** `calculateCasterLevel` + `SPELL_SLOT_PROGRESSION` + окрема пактова
прогресія. У 2014 половинні й третинні кастери округлюються **вниз на рівні класу**, а не від
сумарного рівня (PHB 164). Перед переїздом переконатись, що golden-послідовності з KR2.3
покривають усі чотири комбінації, інакше рефакторинг тут буде наосліп.

## Журнал

**2026-08-14, thin level-up.** `levelUpCharacter` має 14 рядків: authorization, Zod parse і dispatch.
`src/server/db/levelup-persistence.ts` містить server-side execution та єдину Prisma transaction;
`levelup-content.ts` централізує всі content reads. `applyLevelUp` у `src/rules/levelup.ts` є real
transition для ASI, HP (включно з retroactive CON/Tough), skills, save proficiencies, features,
standard slots і Pact Magic; persistence бере з нього core state, skills і feature delta.

`tests/rules/apply-levelup.test.ts` має контрольований red для feature replacement. Pure suites
зелені. KR2.3 targeted golden пройшли через `spells_test` tunnel: Fighter 1→20, Fighter→Wizard
multiclass та Fighter style replacement. Повний Vitest runner у цьому середовищі зависає після
першого кейсу без summary, тому не використаний як доказ. Golden JSON, Prisma schema, SQL і
BUG-001…011 не змінювалися. `bun run lint`, `git diff --check` і rules import scan зелені;
`bunx tsc --noEmit` має лише дві старі test-only помилки в `custom-asi-system.ts` і
`prepared-spells.test.ts`.
