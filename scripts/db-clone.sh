#!/usr/bin/env bash
#
# Клонує базу з DATABASE_URL у другу базу на тому ж сервері.
#
#   scripts/db-clone.sh spells_test              # схема + контент, без даних користувачів
#   scripts/db-clone.sh spells_staging full      # усе, включно з персонажами
#   scripts/db-clone.sh spells_scratch schema    # тільки структура
#
# Цільова база завжди перестворюється з нуля.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib/pg.sh
load_dotenv

SOURCE_URL="${DATABASE_URL:?DATABASE_URL не заданий — перевір .env}"
TARGET_DB="${1:-}"
MODE="${2:-content}"
JOBS="${DB_CLONE_JOBS:-4}"

if [[ -z "$TARGET_DB" ]]; then
  echo "usage: $0 <target-db> [content|full|schema]" >&2
  exit 1
fi

# Запобіжник: цільова база мусить мати суфікс. Прод перезаписати неможливо.
case "$TARGET_DB" in
  *_test | *_staging | *_dev | *_scratch) ;;
  *)
    echo "ВІДМОВА: '$TARGET_DB' не закінчується на _test / _staging / _dev / _scratch." >&2
    echo "Це навмисно — щоб неможливо було затерти прод." >&2
    exit 1
    ;;
esac

build_url() { build_pg_url "$SOURCE_URL" "${1:-}"; }

SOURCE_DB=$(find_db_name "$SOURCE_URL")
SRC_URL=$(build_url "")
DST_URL=$(build_url "$TARGET_DB")
ADMIN_URL=$(build_url "postgres")

if [[ "$SOURCE_DB" == "$TARGET_DB" ]]; then
  echo "ВІДМОВА: джерело і ціль — одна й та сама база ($SOURCE_DB)." >&2
  exit 1
fi

# Старіший клієнт проти новішого сервера мовчки дає неповний дамп.
SERVER_MAJOR=$(find_server_major "$SRC_URL")
PG_DUMP=$(require_client_binary pg_dump "$SERVER_MAJOR")
PG_RESTORE=$(require_client_binary pg_restore "$SERVER_MAJOR")
PSQL=$(require_client_binary psql "$SERVER_MAJOR")

# Дані користувача — це pers / user / account і все, що на них транзитивно посилається.
# Список рахується з самої бази, а не ведеться руками: писаний руками перелік пропускав
# неявні m2m-таблиці Prisma (`_PersToSpell`, `_ChoiceOptionToPers` — вони не підпадають під
# `pers*`), їхні рядки їхали в копію без самих pers, і відновлення падало на foreign key.
find_user_data_tables() {
  "$PSQL" "$SRC_URL" -tA <<'SQL'
WITH RECURSIVE user_data(oid) AS (
  SELECT c.oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname IN ('pers', 'user', 'account')
  UNION
  SELECT con.conrelid
    FROM pg_constraint con
    JOIN user_data u ON con.confrelid = u.oid
   WHERE con.contype = 'f'
)
SELECT format('public.%I', c.relname)
  FROM user_data u
  JOIN pg_class c ON c.oid = u.oid
 ORDER BY 1;
SQL
}

echo "$SOURCE_DB → $TARGET_DB (режим: $MODE)"

dump_args=(--no-owner --no-acl --format=custom)
case "$MODE" in
  full) ;;
  schema) dump_args+=(--schema-only) ;;
  content)
    # Друкуємо список навмисно: якщо колись з'явиться контентна таблиця з посиланням на
    # user (умовний homebrew, створений користувачем), вона теж потрапить сюди — і це
    # має бути видно одразу, а не виявитись через порожню таблицю в тестах.
    echo "  без даних користувача:"
    while IFS= read -r table; do
      [[ -n "$table" ]] || continue
      dump_args+=(--exclude-table-data="$table")
      echo "    $table"
    done < <(find_user_data_tables)
    ;;
  *)
    echo "Невідомий режим '$MODE'. Доступні: content, full, schema." >&2
    exit 1
    ;;
esac

dump_file=$(mktemp -t spells-clone-XXXXXX)
trap 'rm -f "$dump_file"' EXIT

echo "  дамп…"
"$PG_DUMP" "${dump_args[@]}" --file="$dump_file" "$SRC_URL"

echo "  перестворення бази…"
"$PSQL" "$ADMIN_URL" -v ON_ERROR_STOP=1 -q <<SQL
SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
 WHERE datname = '$TARGET_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "$TARGET_DB";
CREATE DATABASE "$TARGET_DB";
SQL

echo "  відновлення…"
"$PG_RESTORE" --no-owner --no-acl --jobs="$JOBS" --dbname="$DST_URL" "$dump_file"

echo
"$PSQL" "$DST_URL" -tAc "
  SELECT relname || ': ' || n_live_tup
    FROM pg_stat_user_tables
   WHERE n_live_tup > 0
   ORDER BY n_live_tup DESC
   LIMIT 12;
" | sed 's/^/  /'

echo
echo "Готово. DATABASE_URL для цієї бази:"
echo "  $(build_url "$TARGET_DB" | sed -E 's#://([^:]+):[^@]+@#://\1:***@#')"
