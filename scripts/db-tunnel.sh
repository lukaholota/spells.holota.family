#!/usr/bin/env bash
#
# SSH-тунель до Postgres на сервері. Потрібен для локальної розробки і тестів:
# база назовні не відкрита, у pg_hba.conf пускають лише 127.0.0.1, а тунель робить
# підключення саме таким.
#
#   ./scripts/db-tunnel.sh          # підняти, якщо ще не піднятий
#   ./scripts/db-tunnel.sh --stop   # прибрати
#   ./scripts/db-tunnel.sh --status
#
# Адреса в .env і .env.test має вказувати на 127.0.0.1:$LOCAL_PORT.

set -euo pipefail

LOCAL_PORT="${DB_TUNNEL_PORT:-5454}"
SSH_TARGET="${DB_TUNNEL_TARGET:-srvh}"
REMOTE_PORT="${DB_TUNNEL_REMOTE_PORT:-5432}"
PROBE_TIMEOUT_SECONDS="${DB_TUNNEL_PROBE_TIMEOUT:-5}"

FORWARD="$LOCAL_PORT:127.0.0.1:$REMOTE_PORT"

find_tunnel_pid() {
  pgrep -f "ssh -f -N -L $FORWARD $SSH_TARGET" || true
}

# `nc -z` доводить лише, що ssh прийняв локальне з'єднання, — а він приймає його й тоді, коли на
# тому кінці вже нікого немає. Саме так вийшло після рестарту Postgres 2026-08-10: `--status`
# казав «працює», а тести падали на таймаутах хука. Тому питаємо саму базу: SSLRequest — вісім
# байтів, на які живий Postgres відповідає рівно одним ('S' або 'N').
is_database_answering() {
  local reply
  reply=$(printf '\x00\x00\x00\x08\x04\xd2\x16\x2f' \
    | nc -w "$PROBE_TIMEOUT_SECONDS" 127.0.0.1 "$LOCAL_PORT" 2>/dev/null \
    | head -c 1 || true)
  [[ "$reply" == "S" || "$reply" == "N" ]]
}

stop_tunnel() {
  local pid
  pid=$(find_tunnel_pid)
  if [[ -z "$pid" ]]; then
    echo "тунелю немає"
    return 0
  fi
  kill $pid
  echo "тунель прибрано (pid $pid)"
}

report_status() {
  local pid
  pid=$(find_tunnel_pid)
  if [[ -n "$pid" ]] && is_database_answering; then
    echo "тунель працює: 127.0.0.1:$LOCAL_PORT → $SSH_TARGET:$REMOTE_PORT (pid $pid)"
    return 0
  fi
  echo "тунелю немає"
  return 1
}

# Мертвий ssh-процес, який тримає порт, дає найгірший симптом: підключення відкривається
# і зависає. Тому перевіряємо не наявність процесу, а те, що порт справді відповідає.
start_tunnel() {
  if report_status >/dev/null 2>&1; then
    report_status
    return 0
  fi

  local stale
  stale=$(find_tunnel_pid)
  [[ -n "$stale" ]] && kill $stale

  ssh -f -N -L "$FORWARD" "$SSH_TARGET"

  local attempt=1
  while (( attempt <= 10 )); do
    if is_database_answering; then
      report_status
      return 0
    fi
    sleep 1
    (( attempt++ ))
  done

  echo "ВІДМОВА: тунель піднявся, але база через 127.0.0.1:$LOCAL_PORT не відповідає" >&2
  return 1
}

case "${1:-}" in
  --stop) stop_tunnel ;;
  --status) report_status ;;
  "") start_tunnel ;;
  *) echo "usage: $0 [--stop|--status]" >&2; exit 1 ;;
esac
