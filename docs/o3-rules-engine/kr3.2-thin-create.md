# KR3.2 — Тонкий `createCharacter`

**Ціль:** [O3](README.md) · **Статус:** ☐ не розпочато · **Залежить від:** KR3.1

## Навіщо

`src/lib/actions/character.ts` — 1276 рядків, з них `createCharacter` починається на 149 і тягнеться
до кінця. Усередині послідовно: авторизація, валідація zod, розрахунок характеристик, п'ять окремих
`findUnique` за расою/варіантом/підрасою/походженням/класом/підкласом, обробка ASI з JSON-колонок,
збирання володінь, і транзакція запису.

Це найгарячіше місце застосунку і найменш перевірене.

## Готово, коли

- [ ] `createCharacter` читається згори вниз як послідовність названих кроків, менше 100 рядків
- [ ] математика характеристик, HP, володінь, слотів — у `src/rules/`
- [ ] завантаження контенту — одним викликом у `src/server/db/`, не сімома `findUnique` вроздріб
- [ ] golden-файли з [KR2.2](../o2-characterization/kr2.2-golden-creation.md) зелені без правок
- [ ] `applyRacialChoices`, `normalizeASI`, `extractFlexibleGroups`, `plainAsiChoiceGroups` та інші
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

_порожньо_
