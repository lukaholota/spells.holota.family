# KR3.4 — Межа бази даних

**Ціль:** [O3](README.md) · **Статус:** ✅ завершено · **Залежить від:** KR3.2, KR3.3

## Навіщо

Зараз `prisma` імпортується у 28 файлах — у серверних екшенах, у `src/lib/logic/`, всюди. Через це
неможливо ні протестувати логіку без бази, ні побачити, які запити взагалі виконує застосунок,
ні виправити N+1, бо він розмазаний.

Це та сама шаруватість, що в `office_apps`: є `src/server/db/`, і в хендлерах немає викликів ORM.
Бібліотека при цьому лишається Prisma — див. [Р5](../DECISIONS.md#р5-на-kysely-не-мігруємо).

## Готово, коли

- [x] `src/server/db/` існує, згрупований за областями (contentRepo, persRepo, userRepo…)
- [x] `grep -r "prisma\." src --include=*.ts | grep -v "src/server/db"` — порожньо
- [x] `src/lib/prisma.ts` реекспортується тільки всередині `src/server/db/`
- [x] `dependency-cruiser` забороняє імпорт `@/lib/prisma` поза `src/server/db/` — і це в CI
- [ ] запити на завантаження контенту консолідовані: створення персонажа робить один-два запити,
      а не сім `findUnique` вроздріб (відкладено: KR3.4 не змінював продуктивність)

## Форма

Репозиторій повертає **власні типи**, не Prisma-моделі. Інакше межа фіктивна: Prisma просто
протікає через типи в усі шари, і `src/rules/` знову виявиться прив'язаним до схеми.

```ts
// src/server/db/contentRepo.ts
export async function loadCreationContent(ids: CreationContentIds): Promise<CreationContent>
```

## Побічний ефект, заради якого це варто робити окремо

Коли всі запити зібрані в одному місці, вперше стає видно, скільки їх насправді. Судячи з
`createCharacter`, там мінімум сім послідовних `findUnique` на одне створення персонажа плюс
транзакція. Скільки їх у `getPersById` (614-1222, понад 600 рядків) — наразі невідомо нікому.

Оптимізацію в цьому KR **не робити** — тільки виміряти й записати в журнал. Змінювати структуру
й продуктивність одночасно означає не знати, що спричинило регресію.

## Журнал

- 2026-08-14: усі `prisma.` і імпорти `@/lib/prisma` винесені в `src/server/db/`; action paths
  лишилися thin re-export boundaries для збереження публічних контрактів.
- 2026-08-14: `bun run check:db-boundary` (dependency-cruiser 16.10.0 через Bun) зелений і доданий
  у CI перед lint. Статичний audit `.ts`/`.tsx` також порожній поза `src/server/db/`.
- 2026-08-14: targeted Fighter 1→20 golden пройшов. Повний multi-case Vitest runner інколи не
  повертає summary; як proof не використовувався. `tsc` лишає дві старі test-only помилки в
  `custom-asi-system.ts` і `prepared-spells.test.ts`.
- Query-count consolidation свідомо не робилась: це окремий optimization backlog, щоб не змішувати
  performance change з DB-boundary refactor.
