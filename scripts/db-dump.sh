#!/usr/bin/env bash
#
# Знімок структури бази з DATABASE_URL у db/schema.sql.
#
# Це не міграція і не історія — це поточний стан схеми одним файлом, з якого
# піднімається порожня база (тестова, CI). Перегенеровується через `bun run db:pull`.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib/pg.sh
load_dotenv

SOURCE_URL="${DATABASE_URL:?DATABASE_URL не заданий — перевір .env}"
OUT=db/schema.sql

url=$(build_pg_url "$SOURCE_URL")
server_major=$(find_server_major "$url")
pg_dump_bin=$(require_client_binary pg_dump "$server_major")

echo "  дамп схеми $(find_db_name "$url") (сервер $server_major, клієнт $(find_client_major "$pg_dump_bin"))…"

dump_args=(--schema-only --no-owner --no-privileges)

# pg_dump ≥16.10 вставляє в дамп випадковий \restrict-токен, через який кожен прогін
# дає інший файл. Фіксуємо ключ, щоб у git було видно тільки реальні зміни схеми.
# Ключ мусить бути суто алфавітно-цифровим — підкреслення pg_dump відкидає.
if "$pg_dump_bin" --help | grep -q -- '--restrict-key'; then
  dump_args+=(--restrict-key=spellsSchemaBaseline)
fi

mkdir -p "$(dirname "$OUT")"
"$pg_dump_bin" "$url" "${dump_args[@]}" --file="$OUT"

echo "  $OUT — $(grep -c '^CREATE TABLE' "$OUT") таблиць, $(grep -c '^CREATE TYPE' "$OUT") типів, $(wc -l < "$OUT" | tr -d ' ') рядків"
