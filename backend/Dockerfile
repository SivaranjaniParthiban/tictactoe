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
ARG CACHE_BUST=5

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml
CMD ["sh", "-ec", "DB_ADDR=${NAKAMA_DATABASE_ADDRESS:-$DATABASE_URL}; if [ -z \"$DB_ADDR\" ]; then echo 'Missing database address: set NAKAMA_DATABASE_ADDRESS or DATABASE_URL' >&2; exit 1; fi; case \"$DB_ADDR\" in postgresql://*) DB_ADDR=${DB_ADDR#postgresql://} ;; postgres://*) DB_ADDR=${DB_ADDR#postgres://} ;; esac; PUBLIC_PORT=${PORT:-7350}; echo \"Starting Nakama on socket port ${PUBLIC_PORT}\"; /nakama/nakama migrate up --database.address \"$DB_ADDR\" && exec /nakama/nakama --config /nakama/data/config.yml --database.address \"$DB_ADDR\" --socket.port \"$PUBLIC_PORT\" --console.port 7351 --http.port 7349 --runtime.path /nakama/data/modules --runtime.js_entrypoint main.js"]
