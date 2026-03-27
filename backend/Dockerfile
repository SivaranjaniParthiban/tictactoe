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

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml

# NAKAMA_DATABASE_ADDRESS should be set in Railway variables as:
# postgres:PASSWORD@postgres.railway.internal:5432/railway  (no postgres:// prefix)
CMD ["sh", "-c", "nakama migrate up --database.address $NAKAMA_DATABASE_ADDRESS && nakama --config /nakama/data/config.yml --database.address $NAKAMA_DATABASE_ADDRESS --socket.port 7350 --console.port 7351 --http.port 7349 --runtime.path /nakama/data/modules --runtime.js_entrypoint main.js"]
