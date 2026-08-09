# Сервер — фактичний стан

Знято з живої машини 2026-08-09. Це **опис того, що є**, а не того, як має бути.

Документ тимчасовий за задумом: усе, що тут описано словами, має з часом переїхати в
`Dockerfile`/`compose` і перестати бути прозою. Поки цього не сталося — це єдине місце, де стан
сервера взагалі записаний. Раніше він не був записаний ніде.

**Секретів тут немає і бути не повинно.** Ні паролів, ні URL з креденшелами, ні хостів.

## Машина

|      |                                                     |
| ---- | --------------------------------------------------- |
| Хост | `vaua0071344`, Debian, ядро з `/dev/sda1`           |
| CPU  | а**2**                                              |
| RAM  | **3 946 MB**, з них зайнято 3 168, **доступно 521** |
| Swap | 2 048 MB, задіяно 171                               |
| Диск | 47 GB, зайнято 35 GB, **вільно 11 GB** (77 %)       |

**Машина не наша одна.** У nginx лежать конфіги інших сайт — при перевірці він лаявся на
конфлікт `server_name` для `trgou.online` / `rgou.online`. Тобто будь-яка перебудова оточення
зачіпає сусідів, і «просто поставити Docker/Coolify тут» — не безкоштовна дія.

**Наслідок із ресурсів:** ставити на цю машину Grafana, Loki, PostHog або Coolify **не можна** —
вільної пам'яті пів гігабайта при вже задіяному свапі. Моніторинг має жити зовні (і має жити зовні
в принципі: монітор на тій самій машині не повідомить, що машина лягла).

## Дві бази даних, і це головна пастка

На машині **два кластери Postgres**:

| Порт           | Версія    | База         | Чия                 |
| -------------- | --------- | ------------ | ------------------- |
| 5432 (типовий) | **11.22** | `ur_db_prod` | чужа, не цей проєкт |
| **5454**       | **16**    | **`spells`** | наша                |

`psql` і `sudo -u postgres psql -c '\l'` без явного порту йдуть у **5432**, тобто показують чужий
кластер, у якому `spells` немає. Легко зробити хибний висновок «нашої бази на сервері немає».

Порт 5454 доступний **ззовні** — раннери GitHub Actions ходять у `spells_ci_test` саме туди
([KR1.4](o1-safety-net/kr1.4-ci.md)). Тобто Postgres із даними 809 користувачів слухає інтернет.
Чи є обмеження по IP — не перевірено; якщо немає, це найбільша діра в периметрі, і вона важливіша
за все, що ми обговорювали про шифрування бекапів.

Бази проєкту на цьому кластері: `spells` (прод), `spells_test` (локальні тести власника),
`spells_ci_test` (тільки CI) — див. [Р8](DECISIONS.md#р8).

## Застосунок

systemd-юніт `/etc/systemd/system/char.service`:

```ini
[Unit]
Description=Next.js app (char)
After=network.target

[Service]
Type=simple
User=luka
Group=luka
WorkingDirectory=/home/luka/char/current
Environment=PUPPETEER_USE_SPARTICUZ=1
Environment=PUPPETEER_DISABLE_DEV_SHM_USAGE=0
Environment=PDF_SET_CONTENT_TIMEOUT_MS=60000
Environment=PDF_RENDER_TIMEOUT_MS=60000
Environment=PUPPETEER_LAUNCH_TIMEOUT_MS=120000
Environment=PDF_STRICT_SECTIONS=1
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/home/luka/char/.env
EnvironmentFile=/home/luka/char/.env.local
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Запускається **`node`, не bun** — тобто в контейнері `CMD ["node", "server.js"]` відповідає проду.
`PORT=3000`, `Restart=always` з паузою 5 с (у compose еквівалент — `restart: unless-stopped`).

**`EnvironmentFile` — ось звідки береться `DATABASE_URL`**, і це робить старий чекаут
`/home/luka/char/` **несучою конструкцією**, а не мотлохом: `.env` і `.env.local` там читає systemd.
Видалити теку = зупинити сервіс. Сам Next ці файли не бачить — його `WorkingDirectory` це тека
релізу, де жодного `.env` немає, тож **єдине джерело змінних — systemd**.

Файлів два, і **пізніший перекриває раніший**: для будь-якого ключа, що є в обох, працює значення
з `.env.local`, а з `.env` мовчки ігнорується. Тобто прочитати файли й дізнатися діючу конфігурацію
**неможливо** — джерело істини це `/proc/<pid>/environ`.

### Змінні, які реально має процес

Знято з `/proc/<pid>/environ` (лише імена):

`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `DATABASE_URL`,
`SHADOW_DATABASE_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NODE_ENV`, `PORT`,
`PDF_RENDER_TIMEOUT_MS`, `PDF_SET_CONTENT_TIMEOUT_MS`, `PDF_STRICT_SECTIONS`,
`PUPPETEER_DISABLE_DEV_SHM_USAGE`, `PUPPETEER_LAUNCH_TIMEOUT_MS`, `PUPPETEER_USE_SPARTICUZ`.

Два зауваження, обидва мають значення для переїзду:

- **`AUTH_TRUST_HOST` і `NEXTAUTH_URL` потрібні next-auth за проксі.** У локальній перевірці
  контейнера їх не було, тож **логін там не перевірявся взагалі**. Це саме той клас поломки, що
  після переїзду виглядає як «сайт відкривається, а зайти неможливо».
- **`NEXT_PUBLIC_SITE_URL` у рантаймі відсутній**, хоч і передається у збірку. Так і має бути:
  `NEXT_PUBLIC_*` вшиваються під час `next build`.

Важливе з того, що видно: **PDF ганяється через `@sparticuz/chromium`**
(`PUPPETEER_USE_SPARTICUZ=1`), а не через системний `/usr/bin/chromium`, попри те що
[README](../README.md) називає системний «найстабільнішим варіантом на VPS». Тобто README і машина
розходяться, і машина головніша.

## Розкладка релізів

```
/home/luka/char/
├── current -> releases/1786192393     симлінк на активний реліз
├── previous-release                   шлях попереднього, для автовідкату (KR1.5)
├── releases/                          останні 5
├── shared/cache                       кеш зображень Next, переживає деплой
└── (повний робочий чекаут репозиторію: src, node_modules, .git, .env, .env.local, prisma…)
```

Два зауваження:

- **`previous-release` існує і має 36 байтів**, датований часом останнього деплою — тобто механізм
  автовідкату з [KR1.5](o1-safety-net/kr1.5-smoke-before-deploy.md) реально записує файл на сервері,
  а не тільки в моїй симуляції. Сама гілка відкату при цьому ще жодного разу не виконувалась.
- У `/home/luka/char` лежить **старий робочий чекаут** проєкту від грудня-січня — `node_modules`,
  `.git`, `.idea`, `.cursor`, `.vscode`, `test-features.pdf`, `test_pg.js`, `tmp/`, `tools/`.
  Застосунок його не використовує (`WorkingDirectory` вказує на `current`), але саме там лежать
  `.env` і `.env.local`. Не чистити наосліп, поки не з'ясовано, чи не читає їх щось.

## nginx і TLS

`/etc/nginx/nginx.conf` — стоковий Debian-конфіг, сайти підключаються через `sites-enabled`.
Сертифікати — **certbot, поставлений через snap** (у `df` видно `/snap/certbot`).

Помітне: `ssl_protocols TLSv1 TLSv1.1 TLSv1.2` — TLS 1.0 і 1.1 давно виведені з ужитку, а 1.3
не ввімкнено. Дрібниця, але при нагоді варто підняти.

## Чого на сервері немає

- **Бекапів.** `crontab -l` і `sudo crontab -l` — обидва порожні. Жодного планового завдання
  взагалі. Скрипт [`scripts/db-backup.sh`](../scripts/db-backup.sh) написаний і перевірений, але
  на сервер ще не покладений.
- **Docker.** Немає ні на сервері, ні в репозиторії.
- **Моніторингу.** Ні uptime-перевірок, ні збору помилок.

**Скрипт бекапу деплоєм не приїде:** крок `Prepare standalone artifact` копіює `.next`, `public`,
`prisma` і chromium, але **не** `scripts/`. Тож `db-backup.sh` разом із `scripts/lib/pg.sh` треба
класти на сервер окремо і давати йому `DATABASE_URL` (він читає `.env` поруч із текою `scripts/`,
оточення має пріоритет).

## Відкриті питання

Закриваються одним заходом на сервер:

1. ~~**Повний юніт**~~ — закрито 2026-08-09, наведений вище.
2. ~~**Звідки береться `DATABASE_URL`**~~ — закрито: `EnvironmentFile` на `/home/luka/char/.env`
   і `.env.local`.
3. **Чи обмежений доступ до порту 5454** — `sudo ufw status` або `sudo iptables -L -n`.
4. **Що ще крутиться на машині** — `systemctl list-units --type=service --state=running`,
   і чим зайняті 3,1 GB пам'яті (`ps aux --sort=-rss | head -15`).
5. **Чи є снапшоти у провайдера** — це змінює терміновість бекапів.
