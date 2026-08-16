# KR3.5 — Покриття

**Ціль:** [O3](README.md) · **Статус:** ✅ завершено 2026-08-15 · **Залежить від:** KR3.1-3.4

## Навіщо

Вимірювальний KR. Він не додає функціоналу — він доводить, що попередні чотири зроблені насправді,
а не на папері.

## Готово, коли

- [x] покриття `src/rules/` ≥ 80% по рядках, функціях, гілках і statements
- [x] стабільний DB-незалежний runner `bun run test:rules:coverage`
- [x] coverage-пороги в CI: `rules-coverage` job блокує `checks` і деплой
- [x] targeted golden proof зелений без `UPDATE_GOLDEN=1`; golden JSON byte-stable
- [x] у звіті немає файлів `src/rules/` з покриттям 0%

## Про цифри

80% — це не самоціль і не гарантія. Це поріг, нижче якого точно є цілі гілки правил, яких ніхто
ніколи не виконував.

Важливіше за відсоток — **що саме не покрито**. Кожен файл `src/rules/` нижче 50% має отримати
рядок у журналі: чому, і коли буде покритий. Найімовірніші кандидати — рідкісні комбінації
мультикласу й екзотичні раси.

## Чого не робити

**Не писати тести заради відсотка.** Тест, який викликає функцію й перевіряє, що вона не кинула
виняток, підіймає покриття й не ловить нічого. Якщо для якогось шматка важко придумати змістовний
тест — це найчастіше сигнал, що шматок робить забагато і його треба різати далі, а не вкривати
формально.

## Журнал

### 2026-08-15 — завершено

Додано ізольований `vitest.rules.config.mts`: він запускає лише
`tests/rules/coverage/**/*.test.ts`, включає весь runtime-код `src/rules/**/*.ts`, не має
`setupFiles`, Prisma, Next або I/O-залежностей і має незнижувані global thresholds 80% для
lines/functions/branches/statements. `bun run test:rules:coverage` — його єдиний стабільний
локальний вхід; окремий CI job `rules-coverage` виконує той самий скрипт до DB-dependent `checks`.

Фінальний чистий serial run: 8/8 тестів, exit 0.

| Модуль | Statements | Branches | Functions | Lines | Невкриті/слабші гілки |
|---|---:|---:|---:|---:|---|
| `abilities.ts` | 96.42% | 89.18% | 100% | 98.52% | fallback JSON-clone не відтворюється звичайним JSON payload |
| `armor.ts` | 100% | 84.21% | 100% | 100% | legacy fallback-варіанти ability metadata |
| `character-creation.ts` | 90.78% | 76.00% | 93.75% | 96.61% | defensive missing-`racialChoices` fallback |
| `levelup.ts` | 100% | 88.88% | 100% | 100% | optional-array fallback варіанти |
| `proficiency.ts` | 89.28% | 83.78% | 85.71% | 95.23% | defensive non-array object payload |
| `spellcasting.ts` | 100% | 97.05% | 100% | 100% | missing progression entry |
| **Разом** | **95.32%** | **85.46%** | **97.29%** | **98.22%** | **усі метрики ≥80%** |

Controlled-red: тест Pact Magic спочатку навмисно очікував `casterLevel: 10` для
Wizard 5 / Warlock 5 і впав із фактичним `{ casterLevel: 5, pactLevel: 5 }`; після відновлення
правильного очікування він зелений. Це фіксує, що Pact Magic не змішується зі стандартними слотами.

Legacy `tests/rules/{class-progression,hit-points,spell-slots}.test.ts` звертаються до Prisma й
не входять до coverage runner: вони не є pure rules tests. Targeted golden
`fighter-1-to-20` пройшов 1/1 (21 сценарій свідомо skipped) через `spells_test`; `git status` і
`git diff` для `tests/golden/**/*.json` порожні. Повний levelup golden suite цього разу завис без
summary, тому не зарахований як proof. `bunx tsc --noEmit` лишається з двома відомими test-only
помилками в `tests/fixtures/builds/custom-asi-system.ts` і `tests/rules/prepared-spells.test.ts`.
