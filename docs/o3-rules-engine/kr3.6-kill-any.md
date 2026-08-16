# KR3.6 — Прибрати `as any` з ядра

**Ціль:** [O3](README.md) · **Статус:** ✅ закрито 2026-08-15 · **Залежить від:** KR3.1, KR3.4

## Навіщо

**656 `as any`** по `src/` станом на 2026-08-07. Кожен з них — місце, де компілятор перестає
допомагати, а ШІ, який пише наступну правку, перестає отримувати зворотний зв'язок. Для проєкту,
де 90% коду генерується, це найдорожчий вид боргу.

Показово: `@ts-ignore` — нуль. Тобто ніхто не глушив помилки навмисно; типи просто розширювали,
доки не скомпілюється.

## Готово, коли

- [x] нуль `as any` у `src/rules/`
- [x] нуль `as any` у `src/server/db/`
- [x] JSON-колонки описані типами й розбираються через zod на межі бази
- [x] `eslint` забороняє `as any` у цих двох каталогах (решта — попередження)
- [x] загальна кількість по `src/` записана в журнал для порівняння

## Де вони живуть

Основне джерело — **JSON-колонки Prisma**. `ASI`, `weaponProficiencies`, `prerequisites`,
`effects` типізовані як `Json`, тобто `unknown`, тож будь-яке звернення до поля вимагає касту.
Звідси конструкції на кшталт `(subrace as any)?.replacesASI`.

Правильне місце для їх розбору — **межа `src/server/db/`**. Репозиторій читає `Json`, проганяє
через zod-схему й повертає типізовану структуру. Далі всередину `src/rules/` `unknown` не потрапляє
взагалі, і касти стають непотрібними самі.

Це також ловить реальні баги: `(subrace as any)?.replacesASI` у `createCharacter` читає поле, якого
може не бути в схемі. Зараз воно тихо дає `undefined`. Зі схемою zod це стане видимою помилкою.

## Порядок

1. Описати zod-схеми для JSON-колонок — по одній, починаючи з `ASI` (найчастіше вживана).
2. Прогнати через них у репозиторії, повертати типізоване.
3. Прибирати касти згори вниз; кожен прибраний каст, який виявив реальну розбіжність, —
   рядок у [KNOWN-BUGS.md](../KNOWN-BUGS.md).
4. Ставити eslint-заборону останньою, коли нуля вже досягнуто.

## Межі

**Тільки `src/rules/` і `src/server/db/`.** Решта 600 з гаком кастів — переважно в компонентах,
вони чекають на O4. Намагатись зробити все одразу означає перетворити O3 на нескінченний.

## Журнал

2026-08-15 — закрито. Початковий audit: 89 `as any` у шести DB-файлах; у `src/rules/` уже було
нуль. JSON boundary винесено в `src/server/db/json.ts`: zod звужує records, string/enum arrays і
weapon proficiency shapes. Prisma relation/scalar поля тепер використовуються напряму.

`rg -n --glob '*.ts' 'as any' src/rules src/server/db` — нуль. Усього лишилось 79 `as any` по
`src/` — поза межами KR3.6, переважно O4/UI debt. ESLint отримав вузький `TSAsExpression >
TSAnyKeyword` error gate для `src/rules/` і `src/server/db/`; controlled-red через stdin
підтвердив, що `input as any` відхиляється.

Proof: `bun run test:rules:coverage` green (95.32% statements, 85.46% branches),
`bun run check:db-boundary` green, targeted lint green. `bunx tsc --noEmit` має лише два
заздалегідь відомі test-only errors у `tests/fixtures/builds/custom-asi-system.ts` і
`tests/rules/prepared-spells.test.ts`. Isolated serial golden proof
`fighter6-wizard14-multiclass` green (2 passed, 20 skipped, exit 0); golden JSON byte-stable.
