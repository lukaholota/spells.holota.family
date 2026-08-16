# KR4.4 — Зменшити компоненти й вкладеність локальними межами

**Ціль:** [O4](README.md) · **Статус:** ✅ зроблено 2026-08-15 · **Залежить від:** KR4.1–KR4.3

## Scope

Взяти один вимірюваний local component boundary: display subtree `ClassChoiceOptionsForm`.
Винесена частина лишається поряд зі creator domain і має одного відповідального parent; це не
нова shared abstraction. Не змінювати server actions, rules, модель даних або `MultiStepForm`
resolver.

## Baseline

`ClassChoiceOptionsForm.tsx` — 436 рядків; display subtree містив group header, selected count,
choice cards, prerequisite reason, feature-info trigger і description preview. Global maximums
KR4.1 лишаються 2 263 рядки та JSX nesting 14.

## Готово, коли

- [x] `ClassChoiceOptionsForm.tsx`: 436 → 291 рядок і він більше не є size candidate; новий локальний `ClassChoiceOptionGroups.tsx` — 220 рядків.
- [x] `ClassChoiceOptionGroups` і його private `ClassChoiceOptionGroup`/`ClassChoiceOptionCard` мають один parent; вони не shared abstraction і не мають другого consumer.
- [x] Render-contract proof зелений після refactor; O2 golden JSON не змінювався.
- [x] Немає змішаного refactor + feature/bug fix.

## Ризики й стримування

Ризик — механічно виконати line limit, сховавши стан у пропси або створивши абстракції без users.
Стримування: малий PR на один root component, локальні children за замовчуванням, review за
контрактом props і scanner/size diff. Ризик візуальної або interaction-регресії стримується
профільними E2E з KR4.5, коли флоу вже має oracle; до того — golden/pure proof і ручна перевірка
конкретного маршруту.

## Журнал

2026-08-15 — план створено. 19 файлів понад 400 зафіксовано як стартова множина.

2026-08-15 — вузько обрано `ClassChoiceOptionsForm`, а не `MultiStepForm`: він мав 436 рядків,
один domain parent і відокремлюваний display subtree. `ClassChoiceOptionGroups` лишається локальним
child: рендерить group header/count, картки, prerequisite reason, feature-info trigger та preview;
parent лишив собі form state, submission, selection transitions, confirmation dialog і persistence.
Жодної generic API, нового user чи зміни rules не додано. Parent став 291 рядком (−145), child —
220; `bun run check:ui-decomposition` green, `ClassChoiceOptionsForm` більше не size candidate;
global JSX max лишився 14, clones — 3 records / 170 lines / 0.53%.

2026-08-15 — до extraction додано server-render proof
`ClassChoiceOptionsForm.test.ts`: selected state, unavailable level prerequisite, group count і
feature-info aria label. Green 1/1. Controlled-red: тимчасова заміна `Обрано:` на `Вибрано:` у
production component дала 1/1 red на exact group-count assertion; original label відновлено, proof
після refactor знову green. Targeted ESLint green.

2026-08-15 — DB tunnel status: «тунелю немає», тому DB/creation golden не запускався. Відомий
KR4.2 blocker не змінювався: останній creation golden 34/35 green; `dwarf-tasha-flexible-asi` red
через три відсутні dwarven tool proficiencies у current output проти fixture. Golden JSON не
редагувався. `bunx tsc --noEmit` має лише відомі blockers:
`tests/fixtures/builds/custom-asi-system.ts:20` (string замість number для ASI value) і
`tests/rules/prepared-spells.test.ts:30` (`number | undefined` замість `number`).
