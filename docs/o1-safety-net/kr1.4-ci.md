# KR1.4 — CI блокує зламаний деплой

**Ціль:** [O1](README.md) · **Статус:** ☐ не розпочато · **Залежить від:** KR1.2, KR1.3

## Навіщо

Зараз `.github/workflows/deploy.yml` на push у `main` збирає й одразу викочує на VPS. Жодної
перевірки перед цим — ні типів, ні лінта, ні тестів. Тобто зламаний код їде в прод автоматично.

Тести з KR1.2/1.3 нічого не варті, поки їх не запускають без участі людини.

## Готово, коли

- [ ] окрема джоба `checks`: `tsc --noEmit`, `eslint`, `vitest run`
- [ ] джоба деплою має `needs: checks` — червоне не викочується
- [ ] `checks` ганяється і на PR, і на push у `main`
- [ ] Postgres у CI через `services:`, `test-db-reset` виконується перед тестами
- [ ] час прогону `checks` — до 5 хвилин

## Кроки

**1. Спочатку перевірити, що `tsc --noEmit` взагалі проходить.** З 656 `as any` він, найімовірніше,
проходить (вони на те й є), але треба переконатись до того, як робити його блокуючим. Якщо падає —
не чинити виправлення тут; зафіксувати кількість помилок у журналі й тимчасово зробити крок
неблокуючим, а виправлення завести в O3.

**2. Джоба:**

```yaml
jobs:
  checks:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: spells_test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx prisma generate
      - run: psql "$TEST_DATABASE_URL" -f db/schema.sql
      - run: psql "$TEST_DATABASE_URL" -f db/content.sql
      - run: bunx tsc --noEmit
      - run: bun run lint
      - run: bun run test

  build-and-deploy:
    needs: checks
    ...
```

**3. Гілки.** Зараз усе комітиться прямо в `main`. Це не проблема сама по собі, поки `checks`
блокує деплой. Але якщо захочеться бачити результат **до** того, як воно поїде в прод — треба
перейти на PR-флоу. Це окреме рішення, тут не вирішуємо.

## Журнал

_порожньо_
