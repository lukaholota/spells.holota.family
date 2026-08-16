# KR5.1 — Інвентар і provenance snapshot джерел `char2024`

**Ціль:** [O5](README.md) · **Статус:** 🔄 порожню межу даних створено 2026-08-15 · **Залежить від:**
закритих O3 (KR3.5 coverage + 2014 golden proof) та O4; явного дозволу власника на локальне
копіювання source-файлів. Архівація GitHub потребує окремого дозволу.

## Мета

Зробити відтворюваний, перевірний snapshot *кандидатів на джерела* з `../char2024` у
`data/2024/source/`, не імпортуючи жодного запису до БД і не тлумачачи його як 2024-контент.
Результат — provenance manifest із hash, розміром, шляхом, source-claim і рішенням
`candidate`/`exclude`/`needs-review`; це вхід для KR5.2/KR5.4, а не seed.

## Зафіксований scope

### У межах

- Read-only inventory `char2024`: його `HEAD`, `git status`, tracked/untracked статус кожного
  файлу та SHA-256.
- Копія лише дозволеного власником набору в новий `data/2024/source/` разом із manifest. Копія
  зберігає байти, оригінальний відносний шлях і не переформатовує JSON/CSV/Markdown.
- Первинна класифікація кожного файла за його власними metadata: `candidate` лише коли джерело
  однозначно назване 2024; `needs-review`, коли файл змішує редакції або джерело не доведене;
  `exclude` для 2014-only чи нерелевантного вмісту.
- Документований результат для п'яти нинішніх кандидатів: `backgrounds.json`,
  `features-legacy.json`, `dnd-data/README.md`,
  `data/references/dnd2024-feats.reference.csv`,
  `data/references/backgrounds_2024.md`.

### Поза межами

- Будь-який seed, DB/schema/Prisma/SQL/migration, `ruleset` enum, UI, правила або golden JSON.
- Парсинг, нормалізація, дедуплікація, переклад, content decision чи імпорт рядків.
- Будь-яка зміна `../char2024`, включно з фінальним комітом; push/архівація GitHub також поза
  межами й потребують окремого явного дозволу власника.

## Відомий стартовий стан і ризики

- `char2024` має багато змінених tracked-файлів і untracked `backgrounds.json`,
  `features-legacy.json`, `data/`, `dnd-data/`. Їх не можна видавати за стан commit
  `35beaf5ce5ddf15d56de824830b79ecb4e49a247` без manifest, що фіксує цей факт.
- На 2026-08-15 `dnd-data/` містить лише README; описані ним тисячі записів не є наявними
  локальними даними. Не вигадувати їх і не ставити «перенесено».
- `dnd2024-feats.reference.csv` містить щонайменше джерела поза PHB 2024 (наприклад Eberron та
  Forgotten Realms), а `dnd-data` прямо називає і PHB/DMG 2024, і XGtE/TCoE. Тому назва файлу або
  наявність слова «2024» недостатня для ruleset classification.
- Єдиний живий продукт лишається D&D 5e 2014. До KR5.2 немає механізму ізолювати 2024 рядки;
  отже snapshot не може читатися застосунком і не може потрапити в seed.

## Готово, коли

- [ ] Перед копіюванням записано `char2024` HEAD, remote, повний `git status --short` і
  tracked/untracked статус кожного джерела.
- [ ] Manifest містить для кожного обраного файла original path, SHA-256, byte size, git status,
  source-claim, classification і коротке обґрунтування; для відсутнього очікуваного файла —
  явний запис `absent`.
- [ ] Snapshot byte-identical до manifest hashes; повторний hash-прохід це доводить.
- [ ] У production-коді, `prisma/`, `db/`, `prisma/seed/`, golden JSON і `../char2024` немає
  змін від KR5.1.
- [ ] Перевірено, що 2014 golden JSON не змінилися (`git diff --exit-code -- tests/golden`);
  змінювати чи regenerate їх заборонено.
- [ ] Архівацію GitHub не виконано без окремого owner approval; її стан і потрібний дозвіл
  записані в журналі.

## План виконання

1. Read-only зафіксувати provenance і точний inventory; зупинитися, якщо owner не підтвердив
   копіювання untracked джерел.
2. Звірити кожен кандидат із metadata й скласти manifest **до** копіювання. Змішаний або
   недоведений файл лишається `needs-review`, не відкидається тихо і не стає 2024 data.
3. Після дозволу власника скопіювати лише погоджений перелік байт-у-байт у `data/2024/source/`,
   згенерувати hashes та звірити їх із manifest.
4. Провести лише scope-proof: статус/diff цільових шляхів і golden JSON. Не запускати seed чи
   DB-тести: KR не торкається runtime і не має права писати в `spells_test`.
5. За окремим дозволом власника виконати або спланувати фінальний commit/archive `char2024`;
   ця зовнішня дія не блокує локальний snapshot і не повинна змішуватися з ним в одному change.

## Characterization / proof gates

Цей KR не змінює наявну rules-поведінку, тому нового characterization test немає. Його
еквівалентний доказ — provenance manifest + byte hash proof + незмінність 2014 golden JSON.
Якщо під час наступного KR змінюється будь-що в `src/lib/actions/` або `src/lib/logic/`, тоді
перед зміною обов'язкові characterization test і controlled-red; для DB-тестів спершу
`./scripts/db-tunnel.sh --status`, лише потім file-serial `spells_test` run.

## Журнал

2026-08-15 — scope зафіксовано після закриття O3 та O4. Graph MCP був доступний, але цей
репозиторій не індексований, тому локальний source discovery зроблено fallback-ом через `rg`.
Read-only inventory показав dirty `../char2024`, untracked candidate data і відсутність фактичних
JSON у `dnd-data/`; це робить provenance gate обов'язковим до будь-якого перенесення.

2026-08-15 — власник уточнив призначення `../char2024`: це pre-refactor snapshot логіки 2014, а
не готовий 2024-імпорт. Тому створено тільки порожню межу `data/2024/source/` з manifest-інвентарем;
жодного байта з `../char2024` не скопійовано. Усі п'ять знайдених кандидатів були untracked;
`backgrounds.json` і `features-legacy.json` лишено `needs-review`, бо їхня чиста редакційність не
доведена локальними metadata. `dnd-data/README.md` і
`data/references/dnd2024-feats.reference.csv` містять змішані редакційні/source claims і теж
`needs-review`. Заявлені README набори `dnd-data` (backgrounds/classes/items/monsters/species/spells)
відсутні локально — зафіксовано `absent`. `backgrounds_2024.md` є явним 2024 candidate, але його
не копійовано за уточненим scope. GitHub-архівацію не виконано; для неї, як і раніше, потрібен
окремий дозвіл власника.
