#!/usr/bin/env bash
#
# Бекап бази з DATABASE_URL у стиснутий дамп із ротацією.
#
# Ставиться в cron на сервері. Дамп read-only, продові нічого не робить.
# Тримає три рівні: погодинні, добові, місячні — щоб зіпсовані дані, помічені
# через місяць, ще можна було дістати. Десять останніх дампів від такого не рятують.
#
#   ./scripts/db-backup.sh /var/backups/spells

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/lib/pg.sh
load_dotenv

BACKUP_ROOT="${1:-${BACKUP_DIR:-./backups}}"

KEEP_HOURLY="${KEEP_HOURLY:-24}"
KEEP_DAILY="${KEEP_DAILY:-14}"
KEEP_MONTHLY="${KEEP_MONTHLY:-12}"

SOURCE_URL="${DATABASE_URL:?DATABASE_URL не заданий — перевір .env}"

build_dump() {
  local url="$1" out="$2" server_major pg_dump_bin
  server_major=$(find_server_major "$url")
  pg_dump_bin=$(require_client_binary pg_dump "$server_major")
  "$pg_dump_bin" "$url" -Fc --no-owner --no-privileges --file="$out"
}

# Дамп, який мовчки вийшов порожнім або обрізаним, гірший за відсутній: він створює
# враження, що бекап є. pg_restore --list читає зміст архіву, тобто ловить обидва випадки.
verify_dump() {
  local file="$1" server_major pg_restore_bin entries
  [ -s "$file" ] || { echo "ВІДМОВА: дамп порожній — $file" >&2; return 1; }
  server_major=$(find_server_major "$(build_pg_url "$SOURCE_URL")")
  pg_restore_bin=$(require_client_binary pg_restore "$server_major")
  # `|| true` обов'язковий: grep -c віддає 1 при нулі збігів, і під pipefail скрипт упав би
  # тут-таки, не дійшовши до пояснення. Бекап, що падає без причини, нічим не кращий за тихий.
  entries=$("$pg_restore_bin" --list "$file" | grep -c '^[0-9]' || true)
  if [ "$entries" -lt 1 ]; then
    echo "ВІДМОВА: дамп не читається як архів або порожній усередині — $file" >&2
    return 1
  fi
  echo "  перевірено: $entries об'єктів, $(du -h "$file" | cut -f1)"
}

# Жорсткі посилання, а не копії: добовий і місячний рівні не займають місця, поки
# погодинний оригінал живий, і переживають його видалення.
promote_to_tier() {
  local file="$1" tier="$2" stamp="$3"
  local target="$BACKUP_ROOT/$tier/spells-$stamp.dump"
  [ -e "$target" ] && return 0
  ln "$file" "$target"
  echo "  → $tier/$(basename "$target")"
}

prune_tier() {
  local tier="$1" keep="$2" removed
  removed=$(ls -1t "$BACKUP_ROOT/$tier" 2>/dev/null | tail -n "+$((keep + 1))" || true)
  [ -z "$removed" ] && return 0
  while IFS= read -r name; do
    rm -f "$BACKUP_ROOT/$tier/$name"
    echo "  прибрано $tier/$name"
  done <<< "$removed"
}

run_backup() {
  local url now hourly_file
  url=$(build_pg_url "$SOURCE_URL")
  now=$(date +%Y%m%d-%H%M)

  mkdir -p "$BACKUP_ROOT"/{hourly,daily,monthly}
  hourly_file="$BACKUP_ROOT/hourly/spells-$now.dump"

  echo "бекап $(find_db_name "$url") → $hourly_file"
  build_dump "$url" "$hourly_file"
  verify_dump "$hourly_file"

  promote_to_tier "$hourly_file" daily "$(date +%Y%m%d)"
  promote_to_tier "$hourly_file" monthly "$(date +%Y%m)"

  prune_tier hourly "$KEEP_HOURLY"
  prune_tier daily "$KEEP_DAILY"
  prune_tier monthly "$KEEP_MONTHLY"

  echo "готово: $(du -sh "$BACKUP_ROOT" | cut -f1) у $BACKUP_ROOT"
}

run_backup
