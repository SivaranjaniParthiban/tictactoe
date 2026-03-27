# Stage 1: Build the TypeScript module
FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g esbuild

COPY src ./src

RUN esbuild src/main.ts \
    --bundle \
    --platform=node \
    --target=es2017 \
    --outfile=build/main.js \
    --external:@heroiclabs/nakama-runtime

# Stage 2: Final Nakama image
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

# Cache bust - increment this number to force Railway to rebuild
<<<<<<< codex/analyze-backend-for-railway-deployment-failure-b1q8tz
ARG CACHE_BUST=7
=======
ARG CACHE_BUST=6
>>>>>>> main

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml
COPY entrypoint.sh /nakama/entrypoint.sh

<<<<<<< codex/analyze-backend-for-railway-deployment-failure-b1q8tz
ENTRYPOINT ["/nakama/entrypoint.sh"]
=======
CMD ["sh", "-ec", "DB_ADDR=${NAKAMA_DATABASE_ADDRESS:-}; if [ -z \"$DB_ADDR\" ] && [ -n \"${DATABASE_URL:-}\" ]; then DB_ADDR=$DATABASE_URL; fi; if [ -z \"$DB_ADDR\" ] && [ -n \"${PGHOST:-}\" ] && [ -n \"${PGUSER:-}\" ] && [ -n \"${PGPASSWORD:-}\" ] && [ -n \"${PGDATABASE:-}\" ]; then DB_ADDR=\"${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}\"; if [ -n \"${PGSSLMODE:-}\" ]; then DB_ADDR=\"${DB_ADDR}?sslmode=${PGSSLMODE}\"; fi; fi; case \"$DB_ADDR\" in postgresql://*) DB_ADDR=${DB_ADDR#postgresql://} ;; postgres://*) DB_ADDR=${DB_ADDR#postgres://} ;; esac; if [ -z \"$DB_ADDR\" ]; then echo 'Missing database settings. Set NAKAMA_DATABASE_ADDRESS or DATABASE_URL, or provide PGHOST/PGUSER/PGPASSWORD/PGDATABASE.' >&2; env | grep -E '^(DATABASE_URL|PGHOST|PGPORT|PGUSER|PGDATABASE|PGSSLMODE)=' >&2 || true; exit 1; fi; PUBLIC_PORT=${PORT:-7350}; echo \"Starting Nakama on socket port ${PUBLIC_PORT}\"; echo \"Using database address ${DB_ADDR%@*}@...\"; /nakama/nakama migrate up --database.address \"$DB_ADDR\" && exec /nakama/nakama --config /nakama/data/config.yml --database.address \"$DB_ADDR\" --socket.port \"$PUBLIC_PORT\" --console.port 7351 --http.port 7349 --runtime.path /nakama/data/modules --runtime.js_entrypoint main.js"]
>>>>>>> main
