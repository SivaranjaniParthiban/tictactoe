# lila-tictactoe

## Railway manual start command (backend)

If the service keeps starting Nakama with default DB settings (`root@localhost:26257`), set the Railway **Start Command** manually to:

```bash
sh -ec 'DB_ADDR="${NAKAMA_DATABASE_ADDRESS:-${DATABASE_URL:-}}"; case "$DB_ADDR" in postgresql://*) DB_ADDR=${DB_ADDR#postgresql://} ;; postgres://*) DB_ADDR=${DB_ADDR#postgres://} ;; esac; [ -n "$DB_ADDR" ] || { echo Missing database address >&2; exit 1; }; /nakama/nakama migrate up --database.address "$DB_ADDR" && exec /nakama/nakama --config /nakama/data/config.yml --database.address "$DB_ADDR" --socket.port "${PORT:-7350}" --console.port 7351 --http.port 7349 --runtime.path /nakama/data/modules --runtime.js_entrypoint main.js'
```

This command does not depend on Docker `ENTRYPOINT` behavior and works even when Railway overrides container command handling.
