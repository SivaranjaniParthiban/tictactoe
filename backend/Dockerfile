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
ARG CACHE_BUST=3

COPY --from=builder /app/build/main.js /nakama/data/modules/main.js
COPY config.yml /nakama/data/config.yml

CMD ["sh", "-c", "nakama migrate up --database.address $NAKAMA_DATABASE_ADDRESS && nakama --config /nakama/data/config.yml --database.address $NAKAMA_DATABASE_ADDRESS --socket.port 7350 --console.port 7351 --http.port 7349 --runtime.path /nakama/data/modules --runtime.js_entrypoint main.js"]
