# KR1.2 — Vitest

**Ціль:** [O1](README.md) · **Статус:** ☐ не розпочато · **Залежить від:** нічого

## Навіщо

У проєкті нуль тестів і немає ранера. Треба поставити його і довести на одному справжньому тесті,
що воно взагалі заводиться в цьому оточенні — з `@/`-аліасами, з TS, з тим, що половина коду
тягне `@prisma/client`.

Чому саме Vitest — див. [Р6](../DECISIONS.md#р6-тести--vitest-реальний-postgres-не-моки).

## Готово, коли

- [ ] `vitest` + `@vitest/coverage-v8` у devDependencies
- [ ] `vitest.config.ts` із `@/` → `src/`, `environment: 'node'`
- [ ] `bun run test` і `bun run test:watch` у `package.json`
- [ ] є щонайменше один тест на `src/lib/logic/bonus-calculator.ts`, який реально щось перевіряє,
      а не `expect(true).toBe(true)`
- [ ] тест зелений і виконується менш ніж за 5 секунд

## Кроки

```bash
bun add -d vitest @vitest/coverage-v8
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

Тести кладемо поруч із кодом: `bonus-calculator.test.ts` біля `bonus-calculator.ts`.

## Що зламається (перевірено 2026-08-07)

`src/lib/logic/` не є чистим, хоч і найближчий до цього. Імпорти назовні:

| Імпорт | Файлів | Проблема |
|---|---|---|
| `@prisma/client` | 8 | Тільки типи й enum-и — **безпечно**, до БД не ходить |
| `@/lib/refs/translation` | 3 | Чисті дані — безпечно |
| `@/lib/types/model-types` | 2 | Типи — безпечно |
| `@/lib/prisma` | 2 | **Підніме Pool до Postgres при імпорті** |
| `@/lib/actions/pers` | 2 | **Затягне `next-auth`, `next/cache`, серверні екшени** |

Тобто перший тест треба брати на файлі, який у два останні рядки не потрапляє. `bonus-calculator.ts`
для цього перевірити першим — якщо він транзитивно тягне `@/lib/prisma`, беремо
`spellcasting-progression.ts` або `prerequisiteUtils.ts`.

**Не «розв'язувати» ці залежності зараз.** Розчеплення `logic/` від Prisma — це O3. Тут завдання
одне: довести, що ранер працює.

## Журнал

_порожньо_
