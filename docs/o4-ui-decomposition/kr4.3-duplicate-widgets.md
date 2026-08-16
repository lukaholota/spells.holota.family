# KR4.3 — Звести підтверджені дублікати UI-віджетів

**Ціль:** [O4](README.md) · **Статус:** ✅ зроблено 2026-08-15 · **Залежить від:** KR4.1, KR4.2 коли pair торкається constructor

## Scope

Взяти лише clone pairs з report KR4.1 і рухатись по одному pair за PR. Перед extraction
підтвердити два реальні consumers, однакові props/state transitions та однаковий видимий
результат. Existing shared `FeatChoiceOptionsForm` (три users: creator, level-up, ASI) —
доказ того, як виглядає реальна спільність; він не є автоматичним кандидатом на ще одну
абстракцію.

## Baseline

KR4.1 report: 4 jscpd records, 235 duplicated lines, 0.74%. Він зводить їх до двох pairs:
`BackgroundFeatsForm.tsx` ↔ `FeatsForm.tsx` (119 sum-of-pair-lines) та два `dialog.tsx`
(120). Scanner — лише кандидат: рішення потребує двох живих consumers і того самого
видимого контракту.

## Готово, коли

- [x] Обраний pair має посилання на baseline report, два consumers і зафіксований контракт спільної поведінки.
- [x] Pair зменшився з 119 до 53 sum-of-pair-lines; 53-line залишок — controller logic з різними form schema/store fields, не UI-віджет.
- [x] `FeatPicker` має два production users: `FeatsForm` і `BackgroundFeatsForm`; решта коду лишається локальною.
- [x] Pure render-contract proof зелений; golden JSON не змінено.

## Ризики й стримування

Ризик — злиття лише схожих, але семантично різних екранів. Стримування: scanner лише знаходить
кандидата, рішення приймається за props, transitions і двома consumers; не робити «base modal»
або «universal form». Ризик регресії на одному з users стримує один PR/pair і перевірка обох
маршрутів до/після.

## Журнал

2026-08-15 — план створено; pair-ів навмисно не вигадано до першого scanner baseline.

2026-08-15 — повторний `bun run check:ui-decomposition` підтвердив baseline KR4.1:
4 records, 235 duplicated lines, 0.74%. Інспекція показала, що `FeatsForm` і
`BackgroundFeatsForm` мають тотожний видимий picker: search і clear, grid карток,
selected state, unavailable overlay/reason, feat info modal і source badge. Їхні semantic
відмінності лишаються у caller: title, schema/register field, store update, duplicate filter,
prerequisite state і submit. Новий конкретний `FeatPicker` викликають рівно ці два production
forms. `FeatsForm` живе в constructor (`MultiStepForm`) і level-up (`LevelUpASIForm`),
`BackgroundFeatsForm` — у constructor (`MultiStepForm`).

2026-08-15 — після extraction scanner має 3 records, 170 duplicated lines, 0.54%.
Feat pair зменшився з 119 до 53 sum-of-pair-lines. Залишок не виносився: він прив'язаний до
різних form schema/store field і не є спільним UI-віджетом. Pair двох `dialog.tsx` не чіпався:
`src/components/ui/dialog.tsx` має реальні imports, а `src/lib/components/ui/dialog.tsx` —
жодного in-repo importer, отже немає двох active consumers одного shared widget.

2026-08-15 — `FeatPicker.test.ts` статично рендерить search, selected/unavailable card,
prerequisite reason і caller-provided empty state (2/2 green). Controlled-red: тимчасова заміна
`glass-active` selected card на `selected-feat` дала 1/2 red на exact card-class assertion;
оригінальний class відновлено, test знову 2/2 green. `bunx eslint` для чотирьох змінених
TSX/test files і `bun run check:ui-decomposition` green. Golden JSON не змінювались.

2026-08-15 — `./scripts/db-tunnel.sh --status` показав «тунелю немає», тому creation golden
не запускався. Відомий KR4.2 blocker лишається: за останнім прогоном 34/35 creation golden
green; `dwarf-tasha-flexible-asi` red через три відсутні dwarven tool proficiencies у current
output проти fixture. Не виправлялось і fixture не оновлювався.

2026-08-15 — фінальний `bunx tsc --noEmit` не додав помилок від KR4.3; лишаються тільки
відомі blockers: `tests/fixtures/builds/custom-asi-system.ts:20` (string замість number для
ASI value) і `tests/rules/prepared-spells.test.ts:30` (`number | undefined` замість `number`).
