# KR2.4 — Golden для похідного стану

**Ціль:** [O2](README.md) · **Статус:** ✅ завершено 2026-08-13 · **Залежить від:** KR2.2

## Навіщо

Створення й левелап — це не весь застосунок. Персонажем ще **грають**: відпочивають, витрачають
слоти, вмикають бонуси, використовують фічі. Ця логіка розкидана по `rest-actions.ts` (546),
`spell-slots.ts` (218), `bonus-actions.ts` (390), `feature-uses.ts` (330), `combat-actions.ts` (270)
і `bonus-calculator.ts` (608), і вона так само нетестована.

## Готово, коли

- [x] короткий і довгий відпочинок — golden для pooled resources класів із різним відновленням
- [x] витрата й відновлення слотів, включно з пактовими (Warlock відновлює на короткому)
- [x] розрахунок AC — усі типи бонусів (`FULL` / `MAX2` / `NONE`), броня + щит + фічі + предмети
- [x] використання фіч і їхнє відновлення (`feature-resources.ts`), включно з pooled resources
- [x] бонуси до атаки й шкоди від фіч і магічних предметів
- [x] модифікації характеристик через `ModifyStatModal`

## Пріоритет усередині KR

За частотою скарг, від найважливішого:

1. **AC.** Найбільше джерел бонусів, найскладніше стакання, найпомітніше для гравця.
2. **Слоти заклинань.** Мультиклас + пакт + відпочинок = три системи, що взаємодіють.
3. **Відпочинок.** Що відновлюється, що ні — по класах різне.
4. Використання фіч.
5. Бонуси до атаки/шкоди.

## Формат

Тут golden-файл на кожну комбінацію дає комбінаторний вибух. Замість цього — **таблиці кейсів**
у самому тесті:

```ts
const AC_CASES = [
  { name: "кольчуга без щита", armor: ..., expected: 16 },
  { name: "шкіряна + DEX 18", ... },
  // ...
];
```

Golden-файли лишити для того, де стан великий і структурований (персонаж після довгого
відпочинку). Для скалярів на кшталт AC читабельна таблиця в тесті краща за JSON-файл:
дифф видно одразу, і вона одночасно є документацією правила.

## Журнал

**2026-08-13, старт і план.** Розвідка підтвердила робочі входи: `shortRest`/`longRest`
(`rest-actions.ts`), `restoreSpellSlot`/`restorePactSlot` (`spell-slots.ts`),
`calculateFinalAC` (`bonus-calculator.ts`), `spendFeatureUse`/`restoreFeatureUse`
(`feature-uses.ts`) і `calculateMaxUsesForFeature` (`feature-resources.ts`).
`ModifyStatModal` — UI-шов, що зберігає ручні зміни через окремі server actions; його потрібно
покрити через ці дії, а не компонентним тестом.

Порядок: (1) зняти точні контракти та залежності дій, (2) створити мінімальні DB-фікстури й
golden для структурованого стану відпочинку/слотів, (3) додати читабельні таблиці для AC,
ресурсів, бонусів і ручних модифікацій, (4) підтвердити, що кожна нова перевірка червоніє від
локальної контрольованої поломки, (5) виконати повторний прогін без `UPDATE_GOLDEN` і оновити
цей журнал. Поведінку застосунку в O2 не змінювати; кожну емпірично підтверджену розбіжність з
PHB 2014 спершу заносити в `docs/KNOWN-BUGS.md`.

**2026-08-13, слоти й відпочинок — перша емпірична знахідка.** Додано
`tests/golden/derived-state/rest-and-slots.test.ts` і golden `rest-and-slots.json`. Він фіксує
покрокове відновлення стандартного слота Wizard (1 → 2, без виходу за максимум), пактовий слот
Warlock (окрема дія й short rest повертають 1), а також знімок Fighter 2 після long rest.
Останній підтвердив **BUG-010**: `longRest` подає до `getMaxSpellSlots` загальний рівень замість
caster level і записує Fighter `[3,0,…]`. Баг записано в `KNOWN-BUGS.md`, поведінку не змінено.

**2026-08-13, AC, ресурси й ручні модифікації.** `ac.test.ts` — читабельна таблиця з 8 кейсів
на реальному `PersWithRelations`: unarmored, Leather (`FULL`), Scale Mail (`MAX2`), Chain Mail
(`NONE`), щит із додатковим бонусом, Fighting Style Defense, attuned Ring of Protection і
Bracers of Defense без броні/щита. Тимчасове очікування Scale Mail `15` дало червоний тест із
фактичними `16`; `16` відновлено і тест знову зелений. `resources-and-modifiers.test.ts` +
golden фіксують Second Wind (витрата → ручне відновлення → short rest) та точні записи семи
дій, які викликає `ModifyStatModal` для STR і AC. Пулові ресурси, класи з іншими відпочинками й
бонуси до атаки/шкоди ще лишаються відкритими.

**2026-08-13, pooled resources, bonus table і межі BUG-010.** Додано
`pooled-resources.test.ts` + golden: Monk 4 використовує реальний `KI` через Quickened Healing
(`usePrice: 2`), ручне відновлення додає ту саму ціну, а short rest повертає максимум 4. Sorcerer
3 через Quickened Spell (`usePrice: 2`) покриває окремий long-rest шлях і виявив BUG-011: глобальний
`findFirst` обирає `Storm Rune` (1 use, short rest) як provider `SORCERY_POINTS` замість `Font of
Magic`; pool зупиняється на 1. Баг підтверджено golden-даними й read-only DB-вибіркою, записано в
`KNOWN-BUGS.md`; поведінку не змінено.

`attack-damage-bonuses.test.ts` — таблиця на реальних даних: базовий Longbow, Archery (+2 до
атаки), attuned Bracers of Archery (+2 до ranged damage), Longsword + Dueling (+2 до шкоди
one-handed melee). `rest-and-slots.test.ts` доповнено Paladin 6 (effective caster level 3),
Eldritch Knight 6 (2) і Paladin 2 / Wizard 3 / Eldritch Knight 3 (5): long rest дає їм таблицю
за загальним рівнем 6/6/8, ще раз окреслюючи BUG-010. Golden-и згенеровані через
`UPDATE_GOLDEN=1`. Контрольована поломка пройшла трьома незалежними червоними перевірками:
тимчасові `expectedPoolMaximum: 4`, Dueling damage `4` і half-caster level `4` дали відповідно
golden diff `3 ≠ 4`, assertion `5 ≠ 4` і golden diff `3 ≠ 4`; точні значення відновлено.
Фінальний прогін без `UPDATE_GOLDEN`: 3 файли / 3 тести, 26.37 с, зелений.

**2026-08-13, завершено решту pooled resources.** `pooled-resources.test.ts` розширено шістьма
реальними class/subclass-кейсами, кожен проходить витрату, ручне відновлення та відповідний
відпочинок: Bard 3 / College of Lore (`BARDIC_INSPIRATION`, long), Moon Druid 10 (`WILD_SHAPE`,
short), Life Cleric 6 (`CHANNEL_DIVINITY`, short), Battle Master 3 (`SUPERIORITY_DICE`, short),
Arcane Archer 3 (`ARCANE_SHOT`, short), Soulknife 3 (`PSIONIC_ENERGY`, long). Wild Shape,
Superiority Dice, Arcane Shot і Bardic Inspiration фіксують очікувану поточну поведінку. Cleric
manual restore (1 замість 2) та Psionic Energy (1 замість 4) емпірично розширили доказову базу
вже наявного BUG-011; новий ID не створювався. Golden згенеровано через `UPDATE_GOLDEN=1`.
Контрольована зміна `PSIONIC_ENERGY expectedPoolMaximum` 4 → 5 дала golden diff і 1/1 червоний
(exit 1); значення відновлено. Чистий прогін без прапорця: 1 файл / 1 тест, 35.27 с, зелений.
Усі пункти «Готово, коли» тепер чесно виконані; KR2.4 закрито.
