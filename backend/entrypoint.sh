#!/bin/sh
set -eu

DB_ADDR="${NAKAMA_DATABASE_ADDRESS:-}"

if [ -z "$DB_ADDR" ] && [ -n "${DATABASE_URL:-}" ]; then
  DB_ADDR="$DATABASE_URL"
fi

if [ -z "$DB_ADDR" ] \
  && [ -n "${PGHOST:-}" ] \
  && [ -n "${PGUSER:-}" ] \
  && [ -n "${PGPASSWORD:-}" ] \
  && [ -n "${PGDATABASE:-}" ]; then
  DB_ADDR="${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
  if [ -n "${PGSSLMODE:-}" ]; then
    DB_ADDR="${DB_ADDR}?sslmode=${PGSSLMODE}"
  fi
fi

case "$DB_ADDR" in
  postgresql://*) DB_ADDR=${DB_ADDR#postgresql://} ;;
  postgres://*) DB_ADDR=${DB_ADDR#postgres://} ;;
esac

if [ -z "$DB_ADDR" ]; then
  echo "Missing database settings. Set NAKAMA_DATABASE_ADDRESS or DATABASE_URL, or provide PGHOST/PGUSER/PGPASSWORD/PGDATABASE." >&2
  env | grep -E '^(DATABASE_URL|PGHOST|PGPORT|PGUSER|PGDATABASE|PGSSLMODE)=' >&2 || true
  exit 1
fi

PUBLIC_PORT="${PORT:-7350}"

echo "Starting Nakama on socket port ${PUBLIC_PORT}"
echo "Using database address ${DB_ADDR%@*}@..."

/nakama/nakama migrate up --database.address "$DB_ADDR"

exec /nakama/nakama \
  --config /nakama/data/config.yml \
  --database.address "$DB_ADDR" \
  --socket.port "$PUBLIC_PORT" \
  --console.port 7351 \
  --http.port 7349 \
  --runtime.path /nakama/data/modules \
  --runtime.js_entrypoint main.js
