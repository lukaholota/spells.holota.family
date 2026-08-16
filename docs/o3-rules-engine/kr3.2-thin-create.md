# KR3.2 — Тонкий `createCharacter`

**Ціль:** [O3](README.md) · **Статус:** ✅ завершено 2026-08-14 · **Залежить від:** KR3.1

## Навіщо

`src/lib/actions/character.ts` — 1276 рядків, з них `createCharacter` починається на 149 і тягнеться
до кінця. Усередині послідовно: авторизація, валідація zod, розрахунок характеристик, п'ять окремих
`findUnique` за расою/варіантом/підрасою/походженням/класом/підкласом, обробка ASI з JSON-колонок,
збирання володінь, і транзакція запису.

Це найгарячіше місце застосунку і найменш перевірене.

## Готово, коли

- [x] `createCharacter` читається згори вниз як послідовність названих кроків, менше 100 рядків
- [x] математика характеристик, HP, володінь, слотів — у `src/rules/`
- [x] завантаження контенту — одним викликом у `src/server/db/`, не сімома `findUnique` вроздріб
- [x] golden-файли з [KR2.2](../o2-characterization/kr2.2-golden-creation.md) зелені без правок
- [x] `applyRacialChoices`, `normalizeASI`, `extractFlexibleGroups`, `plainAsiChoiceGroups` та інші
      приватні хелпери переїхали в `src/rules/abilities/` з власними тестами

## Цільова форма

```ts
export async function createCharacter(input: PersFormData) {
  const user = await requireUser();
  const data = parseCreateInput(input);
  const content = await loadCreationContent(data);
  const character = buildCharacter(data, content);   // ← src/rules/, чисте
  return persistCharacter(user.id, character);
}
```

Усе цікаве — в `buildCharacter`, і воно тестується без бази.

## Порядок

1. Витягти хелпери, які вже приватні й майже чисті (`normalizeASI` і компанія) — механічно, тести
   на них одразу.
2. Витягти завантаження контенту в `loadCreationContent`. Тут же зникає N+1: зараз раса, варіант,
   підраса, походження, клас і підклас читаються окремими запитами.
3. Витягти `buildCharacter` — найбільший крок, робити частинами, після кожної ганяти golden.
4. Те, що лишилось, — `persistCharacter`.

## Відомі місця, де буде боляче

- **`initialRaceStaticAcBonus`** — статичний AC-бонус раси (Warforged) навмисно ініціалізується
  в 0 і вмикається тумблером в UI. У коді це пояснено коментарем; при переїзді пояснення має
  лишитися **тестом**, а не коментарем.
- **JSON-колонки** (`ASI`, `weaponProficiencies`, `prerequisites`) — тут живе основна маса з
  656 `as any`. Не намагатись затипізувати їх у цьому KR, це KR3.6.
- **`subraceReplacesAsi` через `as any`** — підраса читається як `any`, бо поля немає в типі.
  Означає розходження схеми й коду; розібратись, чому, перш ніж переносити.

## Журнал

**2026-08-14, thin create.** `createCharacter` тепер має 12 рядків і складається з чотирьох
послідовних етапів: авторизація, parse, `loadCreationContent`, pure build та persistence.
`src/server/db/creation-content.ts` централізує всі початкові Prisma reads, включно з вибраними
option/feature/equipment rows; lookup користувача винесено до `src/server/db/users.ts`. У дії
лишилася тільки транзакція запису.

`buildInitialCharacterState` у `src/rules/character-creation.ts` приймає plain inputs і будує
scores, Resilient saving throw, початкові slots та HP. ASI від раси, варіанту, підраси, racial
choices, feat і background feat збережено з legacy fallback; race-choice ASI також перенесено з
persistence у pure rules. `replacesASI` — реальне поле `Subrace` у Prisma schema, тож доступ
виправлено на `subrace?.replacesASI ?? false` без нового `any`.

`tests/rules/creation-asi.test.ts` і `tests/rules/character-creation.test.ts` не потребують БД.
Контрольований red для race-choice ASI: очікуване DEX 15 впало з фактичним DEX 16, після чого
правильне DEX 16 відновлено. Перевірки: pure rules — 7 passed; creation golden через `spells_test`
tunnel — зелений; `bun run lint` — 0 errors; `git diff --check` — зелений; import-boundary scan
`src/rules/` — чистий. `bunx tsc --noEmit` має 2 старі помилки лише в test fixtures
(`custom-asi-system.ts`, `prepared-spells.test.ts`). Golden JSON, Prisma schema й BUG-001…011 не
змінювалися.
