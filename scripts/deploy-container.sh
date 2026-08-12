#!/usr/bin/env bash
#
# Викочування контейнера char із підміною upstream у nginx.
#
# Живе на сервері, запускається з GitHub Actions по ssh. Новий контейнер піднімається на
# сусідньому порту й перевіряється ще до того, як на нього піде трафік; старий лишається
# живим, поки смоук не підтвердить новий. Саме це робить відкат миттєвим — і саме цього
# не дає `docker rm -f`, після якого відкочуватись уже нема на що.
#
#   ./deploy-container.sh release ghcr.io/lukaholota/char:<sha>
#   ./deploy-container.sh rollback
#   ./deploy-container.sh retire
#
# Разова підготовка сервера (потрібен root, робить власник) — див. docs/SERVER.md.

set -euo pipefail

UPSTREAM_CONF="${CHAR_UPSTREAM_CONF:-/etc/nginx/conf.d/char-upstream.conf}"
SITE_CONF="${CHAR_SITE_CONF:-/etc/nginx/sites-enabled/char}"
ENV_FILE="${CHAR_ENV_FILE:-/home/luka/char.env}"
PREVIOUS_PORT_FILE="${CHAR_PREVIOUS_PORT_FILE:-/home/luka/char-ops/previous-port}"

# Синій-зелений деплой означає новий контейнер щоразу, тобто порожній
# .next/cache/images на ньому: перший запит на кожен розмір картинки з /_next/image
# після деплою йде не з кеша, а через переенкодинг наживо. Тека на хості спільна для
# обох слотів (3000 і 3002), тож розігрітий кеш переживає і деплой, і перемикання слота.
IMAGE_CACHE_DIR="${CHAR_IMAGE_CACHE_DIR:-/home/luka/char-ops/next-image-cache}"

# 3001 зайнятий gitea, тому другий слот саме 3002. Обидва слухають лише 127.0.0.1 —
# назовні застосунок видно тільки через nginx.
SLOT_PORTS=(3000 3002)

HEALTH_ATTEMPTS="${CHAR_HEALTH_ATTEMPTS:-20}"
HEALTH_DELAY_SECONDS="${CHAR_HEALTH_DELAY_SECONDS:-3}"
KEEP_IMAGES="${CHAR_KEEP_IMAGES:-3}"

NGINX_BIN=/usr/sbin/nginx

# Найтихіший спосіб зламати всю цю розкладку — лишити в сайті прибитий `127.0.0.1:3000`
# замість `char_app`. Тоді підміна upstream не робить нічого, смоук зелений (його обслуговує
# СТАРИЙ контейнер), а `retire` гасить саме той, що віддає трафік, — сайт лягає вже після
# зеленого деплою. Тому перевіряється до всього іншого, а не очима під час підготовки.
require_site_uses_upstream() {
  grep -qE 'proxy_pass[[:space:]]+http://char_app;' "$SITE_CONF" 2>/dev/null && return 0
  echo "ВІДМОВА: $SITE_CONF не проксює на upstream char_app." >&2
  echo "Сервер не підготовлений — див. docs/SERVER.md, «Разова підготовка під деплой»." >&2
  return 1
}

find_active_port() {
  local port
  [ -r "$UPSTREAM_CONF" ] || {
    echo "ВІДМОВА: немає $UPSTREAM_CONF — сервер не підготовлений (docs/SERVER.md)" >&2
    return 1
  }
  port=$(sed -n 's/.*server 127\.0\.0\.1:\([0-9]\+\).*/\1/p' "$UPSTREAM_CONF" | head -1)
  [ -n "$port" ] || { echo "ВІДМОВА: не читається порт із $UPSTREAM_CONF" >&2; return 1; }
  echo "$port"
}

# Слотів рівно два, тому «вільний» — це просто той, що не активний. Спершу перевіряється, що
# активний узагалі зі списку: інакше невідомий порт мовчки віддав би перший зі слотів, тобто
# деплой поліз би в контейнер, який зараз тримає трафік.
find_standby_port() {
  local active="$1" free="" known=0
  for port in "${SLOT_PORTS[@]}"; do
    if [ "$port" = "$active" ]; then known=1; else free="$port"; fi
  done
  [ "$known" = 1 ] || {
    echo "ВІДМОВА: активний порт $active не зі списку слотів ${SLOT_PORTS[*]}" >&2
    return 1
  }
  echo "$free"
}

# Контейнер шукається по опублікованому порту, а не по імені: під час першого автоматичного
# деплою на 3000 ще стоїть контейнер `char`, піднятий руками у Фазі 2.
find_container_on_port() {
  docker ps --filter "publish=$1" --format '{{.Names}}' | head -1
}

start_container() {
  local port="$1" image="$2" name="char-$1"
  docker rm -f "$name" >/dev/null 2>&1 || true
  # 777, а не chown на конкретний uid: контейнер пише під `node` з образу, деплой-скрипт
  # виконується під `luka` на хості — узгоджувати uid двох незалежних середовищ заради
  # тимчасового кеша картинок не варто.
  mkdir -p "$IMAGE_CACHE_DIR"
  chmod 777 "$IMAGE_CACHE_DIR"
  # --shm-size=1g: Chromium рендерить PDF у /dev/shm, а в Docker це 64 MB за замовчуванням.
  # PORT усередині контейнера лишається 3000 — назовні відрізняється лише публікація.
  docker run -d --name "$name" --restart unless-stopped \
    --env-file "$ENV_FILE" --shm-size=1g \
    -v "$IMAGE_CACHE_DIR:/app/.next/cache/images" \
    -p "127.0.0.1:$port:3000" "$image" >/dev/null
  echo "  піднято $name з $image"
}

# Сторінкові маршрути віддають 200 навіть із мертвою базою, тому перевіряється саме
# /api/health і саме вміст відповіді — він робить SELECT 1 (та сама причина, що в смоуці).
wait_until_healthy() {
  local port="$1" attempt=1 body
  while [ "$attempt" -le "$HEALTH_ATTEMPTS" ]; do
    body=$(curl --silent --max-time 5 "http://127.0.0.1:$port/api/health" || true)
    if [[ "$body" == *'"database":true'* ]]; then
      echo "  ✓ 127.0.0.1:$port/api/health — база відповідає (спроба $attempt)"
      return 0
    fi
    echo "  … 127.0.0.1:$port/api/health — ${body:-немає відповіді} (спроба $attempt з $HEALTH_ATTEMPTS)"
    sleep "$HEALTH_DELAY_SECONDS"
    attempt=$((attempt + 1))
  done
  echo "ВІДМОВА: контейнер на $port не піднявся здоровим" >&2
  return 1
}

# Зламаний конфіг nginx кладе всі сайти на машині, не лише наш, тому перевірка обов'язкова,
# а невдала перевірка повертає файл як був.
switch_upstream_to() {
  local port="$1" previous
  previous=$(cat "$UPSTREAM_CONF")
  printf 'upstream char_app {\n  server 127.0.0.1:%s;\n}\n' "$port" > "$UPSTREAM_CONF"
  if ! sudo -n "$NGINX_BIN" -t; then
    printf '%s' "$previous" > "$UPSTREAM_CONF"
    echo "ВІДМОВА: nginx -t не пройшов, upstream повернуто на місце" >&2
    return 1
  fi
  sudo -n "$NGINX_BIN" -s reload
  echo "  upstream → 127.0.0.1:$port, nginx перечитав конфіг"
}

# `docker stop`, а не `rm -f`: після `nginx -s reload` старі воркери ще дораховують запити,
# які встигли зайти до перемикання. SIGKILL обірвав би їх посеред відповіді.
stop_container_on_port() {
  local port="$1" name
  name=$(find_container_on_port "$port")
  [ -n "$name" ] || { echo "  на порту $port контейнера немає"; return 0; }
  docker stop "$name" >/dev/null
  docker rm "$name" >/dev/null
  echo "  прибрано $name (порт $port)"
}

login_to_ghcr() {
  [ -n "${GHCR_TOKEN:-}" ] || return 0
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:?GHCR_USER не заданий}" --password-stdin
}

# Образи тегуються по SHA коміта, тобто самі не стають dangling і `image prune` їх не чіпає.
# Прибираються саме теги, а не ID: у того самого образу є ще й `:latest`, і видалення по ID
# зняло б обидва. Образ під живим контейнером Docker видалити не дасть — на це й розрахунок.
prune_old_images() {
  local repository=ghcr.io/lukaholota/char refs
  refs=$(docker images "$repository" --format '{{.Repository}}:{{.Tag}}' | grep -v ':latest$' || true)
  echo "$refs" | tail -n "+$((KEEP_IMAGES + 1))" | while read -r ref; do
    [ -n "$ref" ] || continue
    docker rmi "$ref" >/dev/null 2>&1 || true
  done
}

run_release() {
  local image="${1:?перший аргумент — образ, напр. ghcr.io/lukaholota/char:<sha>}"
  local active standby

  require_site_uses_upstream
  active=$(find_active_port)
  standby=$(find_standby_port "$active")
  echo "викочування $image: активний порт $active, вільний слот $standby"

  login_to_ghcr
  docker pull "$image"
  # Токен живе рівно стільки, скільки прогін GitHub Actions, але лишати його в
  # ~/.docker/config.json між деплоями все одно нема причини.
  docker logout ghcr.io >/dev/null 2>&1 || true

  start_container "$standby" "$image"

  if ! wait_until_healthy "$standby"; then
    docker logs --tail 50 "char-$standby" >&2 || true
    docker rm -f "char-$standby" >/dev/null 2>&1 || true
    echo "трафік не перемикався — прод лишився на порту $active" >&2
    return 1
  fi

  # Пишеться ДО перемикання: після нього попередній порт уже нічим не позначений,
  # а вгадувати його «той, що не активний» не можна — там може стояти труп попереднього деплою.
  mkdir -p "$(dirname "$PREVIOUS_PORT_FILE")"
  echo "$active" > "$PREVIOUS_PORT_FILE"

  switch_upstream_to "$standby"
  echo "готово: трафік на $standby, старий контейнер на $active ще живий до смоуку"
}

run_rollback() {
  local failed previous
  failed=$(find_active_port)
  previous=$(cat "$PREVIOUS_PORT_FILE" 2>/dev/null || true)

  if [ -z "$previous" ] || [ "$previous" = "$failed" ]; then
    echo "ВІДМОВА: немає куди відкочуватись (попередній порт: ${previous:-невідомий})" >&2
    echo "Сайт лишається на зламаному релізі, потрібне ручне втручання." >&2
    return 1
  fi

  if [ -z "$(find_container_on_port "$previous")" ]; then
    echo "ВІДМОВА: на порту $previous контейнера вже немає — відкат неможливий" >&2
    return 1
  fi

  switch_upstream_to "$previous"
  stop_container_on_port "$failed"
  echo "відкочено на порт $previous"
}

run_retire() {
  local previous active
  previous=$(cat "$PREVIOUS_PORT_FILE" 2>/dev/null || true)
  [ -n "$previous" ] || { echo "нема запису про попередній порт — гасити нічого"; return 0; }

  # Окремим присвоєнням, а не всередині `[ ... ] ||`: там errexit вимкнений, і невдалий
  # find_active_port давав порожній рядок, який «не збігається» з чим завгодно. Перевірено —
  # без цього retire при зниклому конфізі nginx гасив контейнер і повертав нуль.
  active=$(find_active_port)
  [ "$previous" != "$active" ] || {
    echo "ВІДМОВА: попередній порт збігається з активним — гасити активний контейнер не будемо" >&2
    return 1
  }
  stop_container_on_port "$previous"
  # Прибирання образів — зручність, а не частина деплою: воно не має робити червоною
  # джобу, яка вже успішно викотила реліз.
  prune_old_images || true
}

case "${1:-}" in
  release) shift; run_release "$@" ;;
  rollback) run_rollback ;;
  retire) run_retire ;;
  *) echo "вжиток: $0 release <образ> | rollback | retire" >&2; exit 2 ;;
esac
