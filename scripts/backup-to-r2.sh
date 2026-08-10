#!/usr/bin/env bash
#
# Вивантаження дампів у Cloudflare R2. Запускається одразу після db-backup.sh.
#
#   ./scripts/backup-to-r2.sh /home/luka/backups/spells
#
# Доступ береться з ~/.config/rclone/rclone.conf, реміт `r2`. Бакет і префікс —
# змінними R2_BUCKET / R2_PREFIX.
#
# Копія в R2 потрібна саме тому, що локальні дампи лежать на тому ж диску, що й база:
# від втрати машини вони не рятують узагалі.

set -euo pipefail

BACKUP_ROOT="${1:-${BACKUP_DIR:-./backups}}"
R2_REMOTE="${R2_REMOTE:-r2}"
R2_BUCKET="${R2_BUCKET:-char}"
R2_PREFIX="${R2_PREFIX:-db_dumps}"

# Погодинні тримаємо в хмарі недовго: 24 дампи на добу це ~89 МБ, і за місяць вийшло б
# за безкоштовний ліміт. Добові й місячні не прибираємо ніколи.
KEEP_REMOTE_HOURLY_DAYS="${KEEP_REMOTE_HOURLY_DAYS:-3}"

TIERS=(hourly daily monthly)

find_rclone() {
  if command -v rclone >/dev/null 2>&1; then
    command -v rclone
  elif [[ -x "$HOME/bin/rclone" ]]; then
    echo "$HOME/bin/rclone"
  else
    echo "ВІДМОВА: rclone не знайдено ні в PATH, ні в ~/bin" >&2
    return 1
  fi
}

upload_tier() {
  local tier="$1"
  [[ -d "$BACKUP_ROOT/$tier" ]] || return 0
  # `copy`, а не `sync`: sync повторив би локальне видалення в хмарі, і втрата диска
  # забрала б із собою й резервну копію.
  "$RCLONE" copy "$BACKUP_ROOT/$tier" "$R2_REMOTE:$R2_BUCKET/$R2_PREFIX/$tier" \
    --s3-no-check-bucket --transfers 4
}

# Успішне завантаження ще не означає цілий файл на тому кінці. `check` звіряє розмір і хеш.
verify_tier() {
  local tier="$1"
  [[ -d "$BACKUP_ROOT/$tier" ]] || return 0
  "$RCLONE" check "$BACKUP_ROOT/$tier" "$R2_REMOTE:$R2_BUCKET/$R2_PREFIX/$tier" \
    --one-way --s3-no-check-bucket
}

prune_remote_hourly() {
  "$RCLONE" delete "$R2_REMOTE:$R2_BUCKET/$R2_PREFIX/hourly" \
    --min-age "${KEEP_REMOTE_HOURLY_DAYS}d" --s3-no-check-bucket
}

report_remote_size() {
  "$RCLONE" size "$R2_REMOTE:$R2_BUCKET/$R2_PREFIX" --s3-no-check-bucket
}

run_upload() {
  RCLONE=$(find_rclone)
  echo "вивантаження $BACKUP_ROOT → $R2_BUCKET/$R2_PREFIX"
  for tier in "${TIERS[@]}"; do
    upload_tier "$tier"
    verify_tier "$tier"
    echo "  $tier — вивантажено і звірено"
  done
  prune_remote_hourly
  report_remote_size | sed 's/^/  /'
}

run_upload
